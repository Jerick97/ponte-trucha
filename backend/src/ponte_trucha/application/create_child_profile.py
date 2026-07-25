"""Caso de uso: crear un perfil infantil bajo la cuenta del adulto autenticado.

Requiere consentimiento `core` vigente (R4). El límite de perfiles es una
decisión diferida de ADR-003; se aplica aquí con
`value_objects.MAX_CHILD_PROFILES_PER_PARENT` hasta que el equipo fije el
valor definitivo.
"""

from __future__ import annotations

from dataclasses import dataclass

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.policy import CURRENT_PRIVACY_POLICY_VERSION
from ponte_trucha.application.ports import ChildProfileRepository as ChildProfileRepositoryPort
from ponte_trucha.application.ports import (
    Clock,
    ConsentRepository,
    IdGenerator,
    ParentAccountRepository,
)
from ponte_trucha.domain.child_profile import ChildProfile
from ponte_trucha.domain.errors import (
    AccountNotFoundError,
    ConsentRequiredError,
    ProfileLimitReachedError,
)
from ponte_trucha.domain.value_objects import (
    MAX_CHILD_PROFILES_PER_PARENT,
    AgeBand,
    ConsentPurpose,
)


@dataclass(frozen=True, slots=True)
class CreateChildProfileCommand:
    alias_id: str
    avatar_id: str
    age_band: AgeBand


class CreateChildProfile:
    def __init__(
        self,
        *,
        accounts: ParentAccountRepository,
        consents: ConsentRepository,
        profiles: ChildProfileRepositoryPort,
        ids: IdGenerator,
        clock: Clock,
    ) -> None:
        self._accounts = accounts
        self._consents = consents
        self._profiles = profiles
        self._ids = ids
        self._clock = clock

    def execute(
        self, adult: AuthenticatedAdult, command: CreateChildProfileCommand
    ) -> ChildProfile:
        account = self._accounts.get(parent_ref=adult.parent_ref)
        if account is None:
            raise AccountNotFoundError("La cuenta adulta no está provisionada.")
        account.require_active()

        core_consent = self._consents.get(parent_ref=adult.parent_ref, purpose=ConsentPurpose.CORE)
        if core_consent is None or not core_consent.is_active_for(CURRENT_PRIVACY_POLICY_VERSION):
            raise ConsentRequiredError("Falta consentimiento core vigente para crear un perfil.")

        existing_profiles = self._profiles.list_for_parent(parent_ref=adult.parent_ref)
        active_count = sum(1 for profile in existing_profiles if profile.is_active)
        if active_count >= MAX_CHILD_PROFILES_PER_PARENT:
            raise ProfileLimitReachedError("Se alcanzó el máximo de perfiles infantiles.")

        now = self._clock.now()
        profile = ChildProfile.create(
            child_id=self._ids.new_id(prefix="child"),
            alias_id=command.alias_id,
            avatar_id=command.avatar_id,
            age_band=command.age_band,
            now=now,
        )
        self._profiles.create(parent_ref=adult.parent_ref, profile=profile)
        self._accounts.save(account.with_profile_count(delta=1, now=now))

        return profile
