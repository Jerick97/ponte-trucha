from __future__ import annotations

import pytest

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.create_child_profile import (
    CreateChildProfile,
    CreateChildProfileCommand,
)
from ponte_trucha.application.get_or_create_account import GetOrCreateAccount
from ponte_trucha.application.update_consent import (
    ConsentDecision,
    UpdateConsent,
    UpdateConsentCommand,
)
from ponte_trucha.domain.errors import ConsentRequiredError, ProfileLimitReachedError
from ponte_trucha.domain.value_objects import MAX_CHILD_PROFILES_PER_PARENT, AgeBand, ConsentPurpose

from .fakes import (
    FixedClock,
    InMemoryChildProfileRepository,
    InMemoryConsentRepository,
    InMemoryParentAccountRepository,
    SequentialIdGenerator,
)

ADULT = AuthenticatedAdult(parent_ref="ref-1", scopes=frozenset({"profiles.write"}))


def _bootstrap_with_core_consent() -> tuple[
    InMemoryParentAccountRepository, InMemoryConsentRepository, InMemoryChildProfileRepository
]:
    accounts = InMemoryParentAccountRepository()
    consents = InMemoryConsentRepository()
    profiles = InMemoryChildProfileRepository()
    clock = FixedClock()
    GetOrCreateAccount(accounts=accounts, consents=consents, clock=clock).execute(
        ADULT, age_gate_rule_version="age-gate-v1"
    )
    UpdateConsent(accounts=accounts, consents=consents, clock=clock).execute(
        ADULT,
        UpdateConsentCommand(
            purpose=ConsentPurpose.CORE,
            decision=ConsentDecision.GRANT,
            policy_version="politica-2026-07-v1",
            method="explicit-click",
        ),
    )
    return accounts, consents, profiles


def test_create_requires_core_consent() -> None:
    accounts = InMemoryParentAccountRepository()
    consents = InMemoryConsentRepository()
    profiles = InMemoryChildProfileRepository()
    GetOrCreateAccount(accounts=accounts, consents=consents, clock=FixedClock()).execute(
        ADULT, age_gate_rule_version="age-gate-v1"
    )
    use_case = CreateChildProfile(
        accounts=accounts,
        consents=consents,
        profiles=profiles,
        ids=SequentialIdGenerator(),
        clock=FixedClock(),
    )

    with pytest.raises(ConsentRequiredError):
        use_case.execute(
            ADULT,
            CreateChildProfileCommand(
                alias_id="zorro-listo", avatar_id="zorro", age_band=AgeBand.EIGHT_TO_TEN
            ),
        )


def test_create_succeeds_with_core_consent_and_increments_profile_count() -> None:
    accounts, consents, profiles = _bootstrap_with_core_consent()
    use_case = CreateChildProfile(
        accounts=accounts,
        consents=consents,
        profiles=profiles,
        ids=SequentialIdGenerator(),
        clock=FixedClock(),
    )

    profile = use_case.execute(
        ADULT,
        CreateChildProfileCommand(
            alias_id="zorro-listo", avatar_id="zorro", age_band=AgeBand.EIGHT_TO_TEN
        ),
    )

    assert profile.child_id == "child-1"
    account = accounts.get(parent_ref="ref-1")
    assert account is not None
    assert account.profile_count == 1


def test_create_rejects_once_profile_limit_is_reached() -> None:
    accounts, consents, profiles = _bootstrap_with_core_consent()
    use_case = CreateChildProfile(
        accounts=accounts,
        consents=consents,
        profiles=profiles,
        ids=SequentialIdGenerator(),
        clock=FixedClock(),
    )
    for _ in range(MAX_CHILD_PROFILES_PER_PARENT):
        use_case.execute(
            ADULT,
            CreateChildProfileCommand(
                alias_id="zorro-listo", avatar_id="zorro", age_band=AgeBand.EIGHT_TO_TEN
            ),
        )

    with pytest.raises(ProfileLimitReachedError):
        use_case.execute(
            ADULT,
            CreateChildProfileCommand(
                alias_id="zorro-listo", avatar_id="zorro", age_band=AgeBand.EIGHT_TO_TEN
            ),
        )
