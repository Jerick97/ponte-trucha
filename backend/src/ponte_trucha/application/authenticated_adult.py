"""Identidad del adulto autenticado, construida solo por el entrypoint HTTP.

Los casos de uso reciben `AuthenticatedAdult`, nunca un `parentRef` ni un
`cognitoSub` tomado del body o de la URL. El entrypoint deriva `parent_ref`
a partir del `sub` validado por el JWT authorizer antes de llamar al caso de
uso; el dominio y la aplicación no vuelven a tocar boto3 ni HMAC.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class AuthenticatedAdult:
    """Adulto autenticado, identificado únicamente por su `parentRef` interno."""

    parent_ref: str
    scopes: frozenset[str]

    def has_scope(self, scope: str) -> bool:
        return scope in self.scopes
