from __future__ import annotations

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.get_or_create_account import GetOrCreateAccount
from ponte_trucha.domain.value_objects import ConsentPurpose, ConsentState

from .fakes import FixedClock, InMemoryConsentRepository, InMemoryParentAccountRepository

ADULT = AuthenticatedAdult(parent_ref="ref-1", scopes=frozenset({"profiles.read"}))


def test_first_access_creates_account_and_default_denied_consents() -> None:
    accounts = InMemoryParentAccountRepository()
    consents = InMemoryConsentRepository()
    use_case = GetOrCreateAccount(accounts=accounts, consents=consents, clock=FixedClock())

    result = use_case.execute(ADULT, age_gate_rule_version="age-gate-v1")

    assert result.created is True
    assert result.account.profile_count == 0
    stored_consents = {
        record.purpose: record.state for record in consents.list_for_parent(parent_ref="ref-1")
    }
    assert stored_consents == {
        ConsentPurpose.CORE: ConsentState.DENIED,
        ConsentPurpose.SERVER_SIDE_AI: ConsentState.DENIED,
        ConsentPurpose.PRODUCT_ANALYTICS: ConsentState.DENIED,
    }


def test_second_access_returns_existing_account_without_resetting_consents() -> None:
    accounts = InMemoryParentAccountRepository()
    consents = InMemoryConsentRepository()
    use_case = GetOrCreateAccount(accounts=accounts, consents=consents, clock=FixedClock())
    use_case.execute(ADULT, age_gate_rule_version="age-gate-v1")

    consents.save(
        parent_ref="ref-1",
        record=consents.get(parent_ref="ref-1", purpose=ConsentPurpose.CORE).grant(  # type: ignore[union-attr]
            policy_version="privacy-v1", method="click", now="2026-07-24T11:00:00Z"
        ),
    )

    result = use_case.execute(ADULT, age_gate_rule_version="age-gate-v1")

    assert result.created is False
    core = consents.get(parent_ref="ref-1", purpose=ConsentPurpose.CORE)
    assert core is not None
    assert core.state == ConsentState.GRANTED
