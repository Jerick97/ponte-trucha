"""Pruebas de ownership/IDOR entre dos cuentas adultas (R4, R6).

Exigido explícitamente por `estandares-de-codigo.md` y ADR-003: un perfil ajeno
debe fallar exactamente igual que un perfil inexistente, sin confirmar su
existencia.
"""

from __future__ import annotations

import pytest

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.create_child_profile import (
    CreateChildProfile,
    CreateChildProfileCommand,
)
from ponte_trucha.application.delete_child_profile import DeleteChildProfile
from ponte_trucha.application.get_or_create_account import GetOrCreateAccount
from ponte_trucha.application.list_child_profiles import ListChildProfiles
from ponte_trucha.application.update_child_profile import (
    UpdateChildProfile,
    UpdateChildProfileCommand,
)
from ponte_trucha.application.update_consent import (
    ConsentDecision,
    UpdateConsent,
    UpdateConsentCommand,
)
from ponte_trucha.domain.errors import ProfileNotFoundError
from ponte_trucha.domain.value_objects import AgeBand, ConsentPurpose

from .fakes import (
    FixedClock,
    InMemoryChildProfileRepository,
    InMemoryConsentRepository,
    InMemoryParentAccountRepository,
    SequentialIdGenerator,
)

ADULT_A = AuthenticatedAdult(parent_ref="ref-a", scopes=frozenset({"profiles.write"}))
ADULT_B = AuthenticatedAdult(parent_ref="ref-b", scopes=frozenset({"profiles.write"}))


def _setup() -> tuple[
    InMemoryParentAccountRepository,
    InMemoryConsentRepository,
    InMemoryChildProfileRepository,
    str,
]:
    accounts = InMemoryParentAccountRepository()
    consents = InMemoryConsentRepository()
    profiles = InMemoryChildProfileRepository()
    clock = FixedClock()

    for adult in (ADULT_A, ADULT_B):
        GetOrCreateAccount(accounts=accounts, consents=consents, clock=clock).execute(
            adult, age_gate_rule_version="age-gate-v1"
        )
        UpdateConsent(accounts=accounts, consents=consents, clock=clock).execute(
            adult,
            UpdateConsentCommand(
                purpose=ConsentPurpose.CORE,
                decision=ConsentDecision.GRANT,
                policy_version="privacy-v1",
                method="explicit-click",
            ),
        )

    profile = CreateChildProfile(
        accounts=accounts,
        consents=consents,
        profiles=profiles,
        ids=SequentialIdGenerator(),
        clock=clock,
    ).execute(
        ADULT_A,
        CreateChildProfileCommand(
            alias_id="alias-zorro", avatar_id="avatar-01", age_band=AgeBand.EIGHT_TO_TEN
        ),
    )

    return accounts, consents, profiles, profile.child_id


def test_adult_b_cannot_list_adult_a_profile() -> None:
    _accounts, _consents, profiles, child_id = _setup()

    listed_by_b = ListChildProfiles(profiles=profiles).execute(ADULT_B)

    assert child_id not in {profile.child_id for profile in listed_by_b}


def test_adult_b_cannot_update_adult_a_profile() -> None:
    accounts, _consents, profiles, child_id = _setup()
    use_case = UpdateChildProfile(accounts=accounts, profiles=profiles, clock=FixedClock())

    with pytest.raises(ProfileNotFoundError):
        use_case.execute(
            ADULT_B,
            UpdateChildProfileCommand(
                child_id=child_id, alias_id="alias-colibri", avatar_id="avatar-02"
            ),
        )


def test_adult_b_cannot_delete_adult_a_profile() -> None:
    accounts, _consents, profiles, child_id = _setup()
    use_case = DeleteChildProfile(accounts=accounts, profiles=profiles, clock=FixedClock())

    with pytest.raises(ProfileNotFoundError):
        use_case.execute(ADULT_B, child_id=child_id)

    # El perfil de A sigue activo: el intento fallido de B no lo afectó.
    remaining = ListChildProfiles(profiles=profiles).execute(ADULT_A)
    assert child_id in {profile.child_id for profile in remaining}


def test_missing_and_foreign_profile_raise_the_same_error_type() -> None:
    accounts, _consents, profiles, _child_id = _setup()
    use_case = UpdateChildProfile(accounts=accounts, profiles=profiles, clock=FixedClock())

    with pytest.raises(ProfileNotFoundError):
        use_case.execute(
            ADULT_B,
            UpdateChildProfileCommand(
                child_id="child-inexistente", alias_id="alias-colibri", avatar_id="avatar-02"
            ),
        )
