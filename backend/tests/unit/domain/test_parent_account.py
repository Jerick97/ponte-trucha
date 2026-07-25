from __future__ import annotations

import pytest

from ponte_trucha.domain.errors import AccountNotActiveError
from ponte_trucha.domain.parent_account import ParentAccount
from ponte_trucha.domain.value_objects import AccountStatus

NOW = "2026-07-24T10:00:00Z"


def test_create_stores_only_age_gate_version_and_timestamp() -> None:
    account = ParentAccount.create(parent_ref="ref-1", age_gate_rule_version="v1", now=NOW)

    assert account.status == AccountStatus.ACTIVE
    assert account.profile_count == 0
    assert not hasattr(account, "birth_date")
    assert not hasattr(account, "email")


def test_with_profile_count_increments_and_bumps_revision() -> None:
    account = ParentAccount.create(parent_ref="ref-1", age_gate_rule_version="v1", now=NOW)

    updated = account.with_profile_count(delta=1, now="2026-07-24T11:00:00Z")

    assert updated.profile_count == 1
    assert updated.revision == 1


def test_start_deletion_moves_status_to_deleting() -> None:
    account = ParentAccount.create(parent_ref="ref-1", age_gate_rule_version="v1", now=NOW)

    deleting = account.start_deletion(now="2026-07-24T11:00:00Z")

    assert deleting.status == AccountStatus.DELETING


def test_mutations_are_rejected_once_account_is_deleting() -> None:
    account = ParentAccount.create(
        parent_ref="ref-1", age_gate_rule_version="v1", now=NOW
    ).start_deletion(now=NOW)

    with pytest.raises(AccountNotActiveError):
        account.with_profile_count(delta=1, now=NOW)

    with pytest.raises(AccountNotActiveError):
        account.start_deletion(now=NOW)
