from __future__ import annotations

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
from ponte_trucha.domain.value_objects import AgeBand, ConsentPurpose

from .fakes import (
    FixedClock,
    InMemoryChildProfileRepository,
    InMemoryConsentRepository,
    InMemoryParentAccountRepository,
    SequentialIdGenerator,
)

ADULT = AuthenticatedAdult(parent_ref="ref-1", scopes=frozenset({"profiles.write"}))


def _setup() -> tuple[InMemoryParentAccountRepository, InMemoryChildProfileRepository, str]:
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
    profile = CreateChildProfile(
        accounts=accounts,
        consents=consents,
        profiles=profiles,
        ids=SequentialIdGenerator(),
        clock=clock,
    ).execute(
        ADULT,
        CreateChildProfileCommand(
            alias_id="zorro-listo", avatar_id="zorro", age_band=AgeBand.EIGHT_TO_TEN
        ),
    )
    return accounts, profiles, profile.child_id


def test_update_changes_alias_and_avatar() -> None:
    accounts, profiles, child_id = _setup()
    use_case = UpdateChildProfile(accounts=accounts, profiles=profiles, clock=FixedClock())

    updated = use_case.execute(
        ADULT,
        UpdateChildProfileCommand(child_id=child_id, alias_id="trucha-veloz", avatar_id="cuy"),
    )

    assert updated.alias_id == "trucha-veloz"
    assert updated.avatar_id == "cuy"


def test_delete_removes_profile_and_decrements_profile_count() -> None:
    accounts, profiles, child_id = _setup()
    use_case = DeleteChildProfile(accounts=accounts, profiles=profiles, clock=FixedClock())

    use_case.execute(ADULT, child_id=child_id)

    remaining = ListChildProfiles(profiles=profiles).execute(ADULT)
    assert child_id not in {profile.child_id for profile in remaining}
    account = accounts.get(parent_ref="ref-1")
    assert account is not None
    assert account.profile_count == 0
