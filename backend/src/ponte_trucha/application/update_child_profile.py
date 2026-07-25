"""Caso de uso: actualizar alias/avatar de un perfil infantil propio.

Ownership se comprueba siempre desde `adult.parent_ref` derivado del access
token; un perfil ausente o de otro adulto produce el mismo `ProfileNotFoundError`
para no confirmar su existencia (R4).
"""

from __future__ import annotations

from dataclasses import dataclass

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.ports import ChildProfileRepository, Clock, ParentAccountRepository
from ponte_trucha.domain.child_profile import ChildProfile
from ponte_trucha.domain.errors import AccountNotFoundError, ProfileNotFoundError


@dataclass(frozen=True, slots=True)
class UpdateChildProfileCommand:
    child_id: str
    alias_id: str
    avatar_id: str


class UpdateChildProfile:
    def __init__(
        self,
        *,
        accounts: ParentAccountRepository,
        profiles: ChildProfileRepository,
        clock: Clock,
    ) -> None:
        self._accounts = accounts
        self._profiles = profiles
        self._clock = clock

    def execute(
        self, adult: AuthenticatedAdult, command: UpdateChildProfileCommand
    ) -> ChildProfile:
        account = self._accounts.get(parent_ref=adult.parent_ref)
        if account is None:
            raise AccountNotFoundError("La cuenta adulta no está provisionada.")
        account.require_active()

        profile = self._profiles.get(parent_ref=adult.parent_ref, child_id=command.child_id)
        if profile is None or not profile.is_active:
            raise ProfileNotFoundError("El perfil no existe o no pertenece a este adulto.")

        updated = profile.rename(
            alias_id=command.alias_id, avatar_id=command.avatar_id, now=self._clock.now()
        )
        self._profiles.save(parent_ref=adult.parent_ref, profile=updated)
        return updated
