"""Deriva `parentRef` desde el `sub` de Cognito, según ADR-003.

    parentRef = base64url(HMAC-SHA256(secretKey[keyVersion], cognitoSub))

La clave HMAC vive en Secrets Manager y solo `api-core` puede leerla (ver
`infra/modules/api`). Este adapter recibe el material ya resuelto por la capa
de composición; nunca lee el secreto directamente desde boto3 aquí para
mantener la clase testeable sin red.

`key_version` identifica qué versión de secreto produjo el HMAC, tal como
describe el ADR, pero no forma parte del valor devuelto: `parentRef` es un
identificador opaco usado como clave DynamoDB, no un contenedor de metadata.
Una rotación de clave la coordina la capa de composición (lectura dual del
secreto actual y el anterior) antes de retirar la versión vieja.
"""

from __future__ import annotations

from ponte_trucha.adapters.hmac_digest import compute_digest
from ponte_trucha.application.ports import ParentRefDeriver


class HmacParentRefDeriver(ParentRefDeriver):
    """Deriva `parentRef` con una clave HMAC y su versión activa."""

    def __init__(self, *, secret_key: bytes, key_version: str) -> None:
        if not secret_key:
            raise ValueError("secret_key no puede estar vacío.")
        self._secret_key = secret_key
        self._key_version = key_version

    def derive(self, *, cognito_sub: str) -> str:
        return compute_digest(secret_key=self._secret_key, payload=cognito_sub)
