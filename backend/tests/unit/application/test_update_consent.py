from __future__ import annotations

import pytest

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.get_or_create_account import GetOrCreateAccount
from ponte_trucha.application.update_consent import (
    ConsentDecision,
    UpdateConsent,
    UpdateConsentCommand,
)
from ponte_trucha.domain.errors import AccountNotFoundError, PolicyVersionStaleError
from ponte_trucha.domain.value_objects import ConsentPurpose, ConsentState

from .fakes import FixedClock, InMemoryConsentRepository, InMemoryParentAccountRepository

ADULT = AuthenticatedAdult(parent_ref="ref-1", scopes=frozenset({"consents.write"}))


def _bootstrap() -> tuple[InMemoryParentAccountRepository, InMemoryConsentRepository]:
    accounts = InMemoryParentAccountRepository()
    consents = InMemoryConsentRepository()
    GetOrCreateAccount(accounts=accounts, consents=consents, clock=FixedClock()).execute(
        ADULT, age_gate_rule_version="age-gate-v1"
    )
    return accounts, consents


def test_grant_moves_purpose_to_granted() -> None:
    accounts, consents = _bootstrap()
    use_case = UpdateConsent(accounts=accounts, consents=consents, clock=FixedClock())

    updated = use_case.execute(
        ADULT,
        UpdateConsentCommand(
            purpose=ConsentPurpose.SERVER_SIDE_AI,
            decision=ConsentDecision.GRANT,
            policy_version="politica-2026-07-v1",
            method="explicit-click",
        ),
    )

    assert updated.state == ConsentState.GRANTED


def test_revoke_moves_granted_purpose_to_revoked() -> None:
    accounts, consents = _bootstrap()
    use_case = UpdateConsent(accounts=accounts, consents=consents, clock=FixedClock())
    use_case.execute(
        ADULT,
        UpdateConsentCommand(
            purpose=ConsentPurpose.CORE,
            decision=ConsentDecision.GRANT,
            policy_version="politica-2026-07-v1",
            method="explicit-click",
        ),
    )

    revoked = use_case.execute(
        ADULT,
        UpdateConsentCommand(
            purpose=ConsentPurpose.CORE,
            decision=ConsentDecision.REVOKE,
            policy_version="politica-2026-07-v1",
            method="explicit-click",
        ),
    )

    assert revoked.state == ConsentState.REVOKED


def test_stale_policy_version_is_rejected() -> None:
    accounts, consents = _bootstrap()
    use_case = UpdateConsent(accounts=accounts, consents=consents, clock=FixedClock())

    with pytest.raises(PolicyVersionStaleError):
        use_case.execute(
            ADULT,
            UpdateConsentCommand(
                purpose=ConsentPurpose.CORE,
                decision=ConsentDecision.GRANT,
                policy_version="privacy-v0-vieja",
                method="explicit-click",
            ),
        )


def test_missing_account_raises_account_not_found() -> None:
    accounts = InMemoryParentAccountRepository()
    consents = InMemoryConsentRepository()
    use_case = UpdateConsent(accounts=accounts, consents=consents, clock=FixedClock())

    with pytest.raises(AccountNotFoundError):
        use_case.execute(
            ADULT,
            UpdateConsentCommand(
                purpose=ConsentPurpose.CORE,
                decision=ConsentDecision.GRANT,
                policy_version="politica-2026-07-v1",
                method="explicit-click",
            ),
        )
