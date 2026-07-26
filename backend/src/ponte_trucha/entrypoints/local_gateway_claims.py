"""Verificación de access tokens de Cognito para el emulador local (Floci).

## Por qué existe

En AWS real, API Gateway HTTP API valida el access token y AWS Lambda Web
Adapter reenvía los claims en `requestContext.authorizer.jwt` (ADR-002). El
emulador local no hace ni una ni otra cosa igual:

1. valida forma, issuer y expiración del token, pero **no** propaga
   `requestContext.authorizer` a la integración Lambda;
2. no implementa Hosted UI ni `/oauth2/authorize`, así que su User Pool solo
   puede emitir tokens de `InitiateAuth`, que **no llevan scopes** de resource
   server (eso solo ocurre en el flujo OAuth de AWS real).

Sin este puente el juego no puede correr contra el emulador con un login real:
FastAPI responde 401 porque nunca ve un `sub`.

## Qué hace y qué no

- Verifica la firma RS256 del token contra el JWKS del propio User Pool, más
  `token_use=access`, `exp`, `iss` y `client_id`. Un token manipulado, vencido,
  de otro pool o de otro app client se rechaza.
- Reconstruye los claims mínimos (`sub`, `scope`) que espera
  `entrypoints/http/auth.py`.
- Los scopes **no** salen del token porque el emulador no puede emitirlos: se
  toman de `PTK_LOCAL_JWT_SCOPES`, que Terraform llena solo cuando
  `use_floci = true` con los scopes del resource server. Es la misma
  concesión que ya hace `backend/scripts/dev_server.py` para desarrollo.

Contención:

- se activa **solo** si `PTK_LOCAL_JWT_CLAIMS=enabled`, variable que Terraform
  define únicamente en el ambiente emulado;
- nunca se usa si el evento ya trae claims del authorizer (AWS real);
- no verifica `aud` porque los access tokens de Cognito no lo llevan: usa
  `client_id`, igual que el JWT authorizer de API Gateway.

La verificación RSA está implementada con la librería estándar
(`RSASSA-PKCS1-v1_5`, RFC 8017 §8.2.2) para no agregar dependencias al zip de
Lambda: se compara la codificación EMSA-PKCS1-v1_5 completa, no una porción.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
import urllib.request
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass, field
from typing import Any, cast

ENABLED_ENV = "PTK_LOCAL_JWT_CLAIMS"
ENABLED_VALUE = "enabled"
USER_POOL_ID_ENV = "PTK_LOCAL_JWT_USER_POOL_ID"
CLIENT_ID_ENV = "PTK_LOCAL_JWT_CLIENT_ID"
SCOPES_ENV = "PTK_LOCAL_JWT_SCOPES"
ENDPOINT_ENV = "AWS_ENDPOINT_URL"

_JWKS_TIMEOUT_SECONDS = 5
# DigestInfo DER de SHA-256 (RFC 8017, apéndice B.1).
_SHA256_DIGEST_INFO = bytes.fromhex("3031300d060960864801650304020105000420")
_MIN_PADDING_BYTES = 8

JwksLoader = Callable[[], Mapping[str, Any]]
RsaPublicKeys = dict[str, tuple[int, int]]


def _no_cached_keys() -> RsaPublicKeys:
    return {}


class InvalidLocalTokenError(Exception):
    """El token no pasó la verificación local. No viaja al cliente."""


def _b64url_decode(segment: str) -> bytes:
    return base64.urlsafe_b64decode(segment + "=" * (-len(segment) % 4))


def _b64url_int(value: str) -> int:
    return int.from_bytes(_b64url_decode(value), "big")


def _verify_rs256(*, signing_input: bytes, signature: bytes, modulus: int, exponent: int) -> bool:
    key_size = (modulus.bit_length() + 7) // 8
    if len(signature) != key_size:
        return False

    signature_int = int.from_bytes(signature, "big")
    if signature_int >= modulus:
        return False

    recovered = pow(signature_int, exponent, modulus).to_bytes(key_size, "big")
    digest = hashlib.sha256(signing_input).digest()
    padding_length = key_size - len(_SHA256_DIGEST_INFO) - len(digest) - 3
    if padding_length < _MIN_PADDING_BYTES:
        return False

    expected = b"\x00\x01" + b"\xff" * padding_length + b"\x00" + _SHA256_DIGEST_INFO + digest
    return hmac.compare_digest(recovered, expected)


def _as_mapping(value: object) -> dict[str, Any]:
    if not isinstance(value, Mapping):
        raise InvalidLocalTokenError("Estructura JSON inesperada.")
    items = cast("Mapping[object, object]", value)
    return {str(key): item for key, item in items.items()}


@dataclass(slots=True)
class LocalCognitoTokenVerifier:
    """Verifica access tokens del User Pool emulado y arma claims para FastAPI.

    `jwks_loader` y `now` se inyectan para poder probar la verificación sin red
    ni depender del reloj real.
    """

    user_pool_id: str
    client_id: str
    scopes: tuple[str, ...]
    jwks_loader: JwksLoader
    now: Callable[[], float] = time.time
    _keys: RsaPublicKeys = field(default_factory=_no_cached_keys, init=False)

    def claims_for(self, authorization: str | None) -> dict[str, object] | None:
        """Claims del token del header, o `None` si no hay bearer token."""

        token = _bearer_token(authorization)
        if token is None:
            return None

        payload = self._verified_payload(token)
        return {"sub": payload["sub"], "scope": " ".join(self.scopes)}

    def _verified_payload(self, token: str) -> dict[str, Any]:
        parts = token.split(".")
        if len(parts) != 3:
            raise InvalidLocalTokenError("El token no tiene tres segmentos.")
        raw_header, raw_payload, raw_signature = parts

        try:
            header = _as_mapping(json.loads(_b64url_decode(raw_header)))
            payload = _as_mapping(json.loads(_b64url_decode(raw_payload)))
            signature = _b64url_decode(raw_signature)
        except (ValueError, json.JSONDecodeError) as error:
            raise InvalidLocalTokenError("El token no es base64url/JSON válido.") from error

        if header.get("alg") != "RS256":
            raise InvalidLocalTokenError("Solo se acepta RS256.")

        modulus, exponent = self._key_for(str(header.get("kid", "")))
        signing_input = f"{raw_header}.{raw_payload}".encode()
        if not _verify_rs256(
            signing_input=signing_input,
            signature=signature,
            modulus=modulus,
            exponent=exponent,
        ):
            raise InvalidLocalTokenError("Firma inválida.")

        self._require_valid_claims(payload)
        return payload

    def _require_valid_claims(self, payload: Mapping[str, Any]) -> None:
        if payload.get("token_use") != "access":
            raise InvalidLocalTokenError("Se requiere un access token.")

        subject = payload.get("sub")
        if not isinstance(subject, str) or not subject:
            raise InvalidLocalTokenError("El token no trae `sub`.")

        issuer = payload.get("iss")
        # El emulador emite `iss` con su propio host, distinto del que ve la
        # Lambda dentro de su contenedor; lo verificable es el User Pool.
        if not isinstance(issuer, str) or not issuer.endswith(f"/{self.user_pool_id}"):
            raise InvalidLocalTokenError("El token pertenece a otro User Pool.")

        if payload.get("client_id") != self.client_id:
            raise InvalidLocalTokenError("El token pertenece a otro app client.")

        expiration = payload.get("exp")
        if not isinstance(expiration, int) or expiration <= self.now():
            raise InvalidLocalTokenError("El token está vencido.")

    def _key_for(self, kid: str) -> tuple[int, int]:
        if kid not in self._keys:
            self._keys = _parse_jwks(self.jwks_loader())
        key = self._keys.get(kid)
        if key is None:
            raise InvalidLocalTokenError("El JWKS del User Pool no incluye ese `kid`.")
        return key


def _parse_jwks(jwks: Mapping[str, Any]) -> RsaPublicKeys:
    raw_keys = jwks.get("keys")
    if not isinstance(raw_keys, Sequence):
        raise InvalidLocalTokenError("JWKS sin lista de claves.")

    keys: RsaPublicKeys = {}
    for raw_key in cast("Sequence[object]", raw_keys):
        key = _as_mapping(raw_key)
        if key.get("kty") != "RSA":
            continue
        keys[str(key.get("kid", ""))] = (_b64url_int(str(key["n"])), _b64url_int(str(key["e"])))
    return keys


def _bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return None
    return token.strip()


def _http_jwks_loader(*, endpoint: str, user_pool_id: str) -> JwksLoader:
    url = f"{endpoint.rstrip('/')}/{user_pool_id}/.well-known/jwks.json"

    def load() -> Mapping[str, Any]:
        with urllib.request.urlopen(url, timeout=_JWKS_TIMEOUT_SECONDS) as response:  # noqa: S310
            return _as_mapping(json.loads(response.read()))

    return load


def build_verifier_from_environment() -> LocalCognitoTokenVerifier | None:
    """Devuelve el verificador solo si el ambiente emulado lo habilitó."""

    if os.environ.get(ENABLED_ENV) != ENABLED_VALUE:
        return None

    user_pool_id = os.environ.get(USER_POOL_ID_ENV)
    client_id = os.environ.get(CLIENT_ID_ENV)
    endpoint = os.environ.get(ENDPOINT_ENV)
    if not user_pool_id or not client_id or not endpoint:
        raise RuntimeError(
            f"{ENABLED_ENV} requiere {USER_POOL_ID_ENV}, {CLIENT_ID_ENV} y {ENDPOINT_ENV}."
        )

    scopes = tuple(scope for scope in os.environ.get(SCOPES_ENV, "").split(" ") if scope)
    if not scopes:
        raise RuntimeError(f"{ENABLED_ENV} requiere {SCOPES_ENV} con al menos un scope.")

    return LocalCognitoTokenVerifier(
        user_pool_id=user_pool_id,
        client_id=client_id,
        scopes=scopes,
        jwks_loader=_http_jwks_loader(endpoint=endpoint, user_pool_id=user_pool_id),
    )
