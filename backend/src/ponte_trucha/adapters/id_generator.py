"""Adapter de identificadores opacos aleatorios (childId, eventId, etc.)."""

from __future__ import annotations

import secrets

from ponte_trucha.application.ports import IdGenerator

_TOKEN_BYTES = 16


class SecureIdGenerator(IdGenerator):
    """Genera IDs aleatorios sin PII, usando `secrets` (CSPRNG)."""

    def new_id(self, *, prefix: str) -> str:
        return f"{prefix}_{secrets.token_urlsafe(_TOKEN_BYTES)}"
