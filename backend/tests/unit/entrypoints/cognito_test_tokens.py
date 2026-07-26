"""Firma de access tokens de prueba para el verificador local.

La clave RSA vive aquí porque dos suites la necesitan
(`test_local_gateway_claims.py` y `test_lambda_handler.py`). Existe **solo**
para las pruebas: no protege nada y no corresponde a ningún ambiente.
"""

from __future__ import annotations

import base64
import hashlib
import json
from collections.abc import Mapping
from typing import Any

from ponte_trucha.entrypoints.local_gateway_claims import LocalCognitoTokenVerifier

MODULUS = int(
    "9d9f896bbbbfae93dd3ab3931d180ae8378deb19aca69a5cbe6c5d2b0c889e5de66e4733"
    "7a36f4f4fe11086a5692b8e85409aad0fe31a08df59262bc52b0d5bf2d43bafb34310c40"
    "910e435bcdba6f90f1b49ac25cbefc07fd28be863c441fca880323ecdb5ecaec6e1db022"
    "eecd7e9b1820173960e366dbf1afdb8360bcc26f0dbfae35a60602ee80fac07ae011ae30"
    "c64a8a3ebb74e764eb7d84f08a4098940569cb8a56a9665a329a4875906b8e57acaff0a2"
    "9a3b6183d23b8d4c631bcd65a1101abfa83ded7ead0196f98e707bc589b4c903f461c550"
    "123c24323f896adc37e2a175940315e92a97109f7eb0e4091c8bb9e18c29affd379d0816"
    "af3490f3",
    16,
)
PRIVATE_EXPONENT = int(
    "427845a645ed867c5a7de7be7135735c0c196ffc4abf9336eb229d838aec8e0441295e23"
    "4a35a4c52fe314ee6b05c2ae4eca28dbab665833a54c8f10a5ba66d911088ff0614911c6"
    "a4a52428b1b01e5e3c5f9227c69ecf7fbaf594aadcfd497eca2eb0d6b087e001264aa4bd"
    "8680e814156f6afbca6cfb3263506abc936de67bef1ce43070a2feed7b414d047e7b4248"
    "bafa57cfb7bb92608fd7b60f95604357db365a1175a5d3cdf5a35a478f64b8a8e1a16da4"
    "1a0b0fa8df91db30d3bcb7c353dc1fefac48f1406e1a86b68ec06d6538e2d50fa2bd708a"
    "fbe234483d5327d3d6f04dc44404e9e97894a2f4e7a7a72d59daf95435f8f953026c3b2a"
    "dd02dc59",
    16,
)
PUBLIC_EXPONENT = 65537

KEY_ID = "us-east-1_prueba"
USER_POOL_ID = "us-east-1_prueba"
CLIENT_ID = "cliente-spa-prueba"
SCOPES = ("profiles.read", "game.play")
NOW = 1_800_000_000.0

_SHA256_DIGEST_INFO = bytes.fromhex("3031300d060960864801650304020105000420")
_KEY_SIZE = (MODULUS.bit_length() + 7) // 8


def b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def sign(signing_input: bytes) -> bytes:
    digest = hashlib.sha256(signing_input).digest()
    padding = b"\xff" * (_KEY_SIZE - len(_SHA256_DIGEST_INFO) - len(digest) - 3)
    encoded = b"\x00\x01" + padding + b"\x00" + _SHA256_DIGEST_INFO + digest
    return pow(int.from_bytes(encoded, "big"), PRIVATE_EXPONENT, MODULUS).to_bytes(_KEY_SIZE, "big")


def access_token(
    *,
    claims: Mapping[str, Any] | None = None,
    alg: str = "RS256",
    kid: str = KEY_ID,
    valid_signature: bool = True,
) -> str:
    payload: dict[str, Any] = {
        "sub": "adulto-1",
        "token_use": "access",
        "iss": f"http://localhost:4566/{USER_POOL_ID}",
        "client_id": CLIENT_ID,
        "exp": int(NOW) + 3600,
    }
    payload.update(claims or {})
    header = b64url(json.dumps({"alg": alg, "typ": "JWT", "kid": kid}).encode())
    body = b64url(json.dumps(payload).encode())
    signature = sign(f"{header}.{body}".encode())
    if not valid_signature:
        signature = bytes([signature[0] ^ 0xFF]) + signature[1:]
    return f"{header}.{body}.{b64url(signature)}"


def jwks() -> Mapping[str, Any]:
    return {
        "keys": [
            {
                "kty": "RSA",
                "kid": KEY_ID,
                "alg": "RS256",
                "n": b64url(MODULUS.to_bytes(_KEY_SIZE, "big")),
                "e": b64url(PUBLIC_EXPONENT.to_bytes(3, "big")),
            }
        ]
    }


def verifier() -> LocalCognitoTokenVerifier:
    return LocalCognitoTokenVerifier(
        user_pool_id=USER_POOL_ID,
        client_id=CLIENT_ID,
        scopes=SCOPES,
        jwks_loader=jwks,
        now=lambda: NOW,
    )
