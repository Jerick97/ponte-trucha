from __future__ import annotations

import pytest

from ponte_trucha.domain.consent import ConsentRecord
from ponte_trucha.domain.errors import InvalidConsentTransitionError
from ponte_trucha.domain.value_objects import ConsentPurpose, ConsentState

NOW = "2026-07-24T10:00:00Z"


def test_initial_consent_starts_denied_for_any_purpose() -> None:
    record = ConsentRecord.initial(ConsentPurpose.SERVER_SIDE_AI, policy_version="v1", now=NOW)

    assert record.state == ConsentState.DENIED
    assert record.revision == 0


def test_grant_from_denied_moves_to_granted_and_bumps_revision() -> None:
    record = ConsentRecord.initial(ConsentPurpose.CORE, policy_version="v1", now=NOW)

    granted = record.grant(policy_version="v1", method="explicit-click", now="2026-07-24T10:05:00Z")

    assert granted.state == ConsentState.GRANTED
    assert granted.revision == 1
    assert granted.revoked_at is None


def test_revoke_from_granted_moves_to_revoked() -> None:
    granted = ConsentRecord.initial(ConsentPurpose.CORE, policy_version="v1", now=NOW).grant(
        policy_version="v1", method="explicit-click", now=NOW
    )

    revoked = granted.revoke(now="2026-07-24T11:00:00Z")

    assert revoked.state == ConsentState.REVOKED
    assert revoked.revoked_at == "2026-07-24T11:00:00Z"


def test_revoke_from_denied_is_rejected() -> None:
    record = ConsentRecord.initial(ConsentPurpose.CORE, policy_version="v1", now=NOW)

    with pytest.raises(InvalidConsentTransitionError):
        record.revoke(now=NOW)


def test_revoked_can_be_granted_again() -> None:
    record = ConsentRecord.initial(ConsentPurpose.CORE, policy_version="v1", now=NOW)
    revoked = record.grant(policy_version="v1", method="click", now=NOW).revoke(now=NOW)

    granted_again = revoked.grant(policy_version="v1", method="click", now=NOW)

    assert granted_again.state == ConsentState.GRANTED


def test_new_policy_version_can_deny_a_previously_granted_purpose() -> None:
    granted = ConsentRecord.initial(ConsentPurpose.CORE, policy_version="v1", now=NOW).grant(
        policy_version="v1", method="click", now=NOW
    )

    denied = granted.deny(policy_version="v2", method="policy-update", now=NOW)

    assert denied.state == ConsentState.DENIED
    assert denied.policy_version == "v2"


def test_is_active_for_requires_granted_state_and_matching_policy_version() -> None:
    granted = ConsentRecord.initial(ConsentPurpose.CORE, policy_version="v1", now=NOW).grant(
        policy_version="v1", method="click", now=NOW
    )

    assert granted.is_active_for("v1") is True
    assert granted.is_active_for("v2") is False


def test_grant_from_granted_is_rejected_to_force_explicit_transitions() -> None:
    granted = ConsentRecord.initial(ConsentPurpose.CORE, policy_version="v1", now=NOW).grant(
        policy_version="v1", method="click", now=NOW
    )

    with pytest.raises(InvalidConsentTransitionError):
        granted.grant(policy_version="v1", method="click", now=NOW)
