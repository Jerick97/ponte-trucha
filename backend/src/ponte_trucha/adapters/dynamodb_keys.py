"""Constructores de claves DynamoDB para la partición adulta (ADR-003).

Centralizar el formato de `PK`/`SK` evita que cada repository invente su propio
esquema y facilita auditar que ninguna ruta usa `Scan`.
"""

from __future__ import annotations

ACCOUNT_SK = "ACCOUNT"


def parent_pk(parent_ref: str) -> str:
    return f"PARENT#{parent_ref}"


def consent_sk(purpose: str) -> str:
    return f"CONSENT#{purpose}"


def profile_sk(child_id: str) -> str:
    return f"PROFILE#{child_id}"


PROFILE_SK_PREFIX = "PROFILE#"
CONSENT_SK_PREFIX = "CONSENT#"
