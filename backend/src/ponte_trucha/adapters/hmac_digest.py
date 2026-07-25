"""Utilidad HMAC-SHA256 compartida por `parentRef` e idempotencia (ADR-003).

Ambos usan la misma forma: `base64url(HMAC-SHA256(secretKey[keyVersion], ...))`.
Centralizarla evita dos implementaciones de criptografía ligeramente distintas.
"""

from __future__ import annotations

import base64
import hashlib
import hmac


def compute_digest(*, secret_key: bytes, payload: str) -> str:
    if not secret_key:
        raise ValueError("secret_key no puede estar vacío.")
    digest = hmac.new(secret_key, payload.encode("utf-8"), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")
