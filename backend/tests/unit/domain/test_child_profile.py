from __future__ import annotations

import pytest

from ponte_trucha.domain.child_profile import ChildProfile
from ponte_trucha.domain.errors import InvalidProfileSelectionError
from ponte_trucha.domain.value_objects import AgeBand, ProfileStatus

NOW = "2026-07-24T10:00:00Z"


def test_create_builds_active_profile_without_pii_fields() -> None:
    profile = ChildProfile.create(
        child_id="child-1",
        alias_id="alias-zorro",
        avatar_id="avatar-01",
        age_band=AgeBand.EIGHT_TO_TEN,
        now=NOW,
    )

    assert profile.status == ProfileStatus.ACTIVE
    assert profile.revision == 0
    assert not hasattr(profile, "birth_date")
    assert not hasattr(profile, "real_name")


def test_create_rejects_alias_outside_catalog() -> None:
    with pytest.raises(InvalidProfileSelectionError):
        ChildProfile.create(
            child_id="child-1",
            alias_id="alias-nombre-real",
            avatar_id="avatar-01",
            age_band=AgeBand.EIGHT_TO_TEN,
            now=NOW,
        )


def test_create_rejects_avatar_outside_catalog() -> None:
    with pytest.raises(InvalidProfileSelectionError):
        ChildProfile.create(
            child_id="child-1",
            alias_id="alias-zorro",
            avatar_id="avatar-999",
            age_band=AgeBand.EIGHT_TO_TEN,
            now=NOW,
        )


def test_rename_updates_alias_avatar_and_bumps_revision() -> None:
    profile = ChildProfile.create(
        child_id="child-1",
        alias_id="alias-zorro",
        avatar_id="avatar-01",
        age_band=AgeBand.EIGHT_TO_TEN,
        now=NOW,
    )

    renamed = profile.rename(
        alias_id="alias-colibri", avatar_id="avatar-02", now="2026-07-24T11:00:00Z"
    )

    assert renamed.alias_id == "alias-colibri"
    assert renamed.avatar_id == "avatar-02"
    assert renamed.revision == 1
    assert renamed.age_band == AgeBand.EIGHT_TO_TEN


def test_mark_deleting_moves_status_and_bumps_revision() -> None:
    profile = ChildProfile.create(
        child_id="child-1",
        alias_id="alias-zorro",
        avatar_id="avatar-01",
        age_band=AgeBand.EIGHT_TO_TEN,
        now=NOW,
    )

    deleting = profile.mark_deleting(now="2026-07-24T11:00:00Z")

    assert deleting.status == ProfileStatus.DELETING
    assert deleting.is_active is False
