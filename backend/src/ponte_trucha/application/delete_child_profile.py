"""Caso de uso: borrar un perfil infantil propio.

Alcance actual: como los agregados `Progress`, `Challenge` y `Attempt` todavía
no existen (backend-serverless #7-8 están pendientes), este caso de uso borra
el `ChildProfile` y ajusta `profileCount`. El workflow completo de borrado con
`DeletionJob`, cursor reanudable y limpieza de localizadores/idempotencia que
describe ADR-003 se implementa en la tarea 10 de
`autenticacion-consentimiento-parental`, una vez existan esos agregados para
poder purgarlos. No marcar esa tarea como completada a partir de este caso de
uso.
"""

from __future__ import annotations

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.ports import ChildProfileRepository, Clock, ParentAccountRepository
from ponte_trucha.domain.errors import AccountNotFoundError, ProfileNotFoundError


class DeleteChildProfile:
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

    def execute(self, adult: AuthenticatedAdult, *, child_id: str) -> None:
        account = self._accounts.get(parent_ref=adult.parent_ref)
        if account is None:
            raise AccountNotFoundError("La cuenta adulta no está provisionada.")
        account.require_active()

        profile = self._profiles.get(parent_ref=adult.parent_ref, child_id=child_id)
        if profile is None or not profile.is_active:
            raise ProfileNotFoundError("El perfil no existe o no pertenece a este adulto.")

        now = self._clock.now()
        self._profiles.save(parent_ref=adult.parent_ref, profile=profile.mark_deleting(now=now))
        self._profiles.delete(parent_ref=adult.parent_ref, child_id=child_id)
        self._accounts.save(account.with_profile_count(delta=-1, now=now))
