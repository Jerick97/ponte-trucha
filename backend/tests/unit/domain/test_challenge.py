from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest

from ponte_trucha.domain.challenge import (
    Challenge,
    ChallengeAlreadyAnsweredError,
    ChallengeExpiredError,
    ChallengeStatus,
    Grading,
    MessageKind,
)
from ponte_trucha.domain.channels import AppType
from ponte_trucha.domain.value_objects import AgeBand, Difficulty

_NOW = datetime(2026, 7, 24, 12, 0, tzinfo=UTC)


def _make_challenge(**overrides: object) -> Challenge:
    defaults: dict[str, object] = {
        "challenge_id": "chal_1",
        "scenario_id": "escenario_1",
        "scenario_version": 1,
        "app_type": AppType.SMS,
        "difficulty": Difficulty(2),
        "message_kind": MessageKind.TRAP,
        "payload_snapshot": {"mensaje": "Ganaste un premio, dame tu clave"},
        "grading": Grading(
            decision=MessageKind.TRAP,
            signal_codes=("pide-clave",),
            feedback_code="pide-clave-nunca",
        ),
        "issued_at": _NOW,
        "valid_until": _NOW + timedelta(minutes=30),
    }
    defaults.update(overrides)
    return Challenge(**defaults)  # type: ignore[arg-type]


def test_challenge_starts_issued_and_hides_grading_from_visible_payload() -> None:
    challenge = _make_challenge()

    assert challenge.status is ChallengeStatus.ISSUED
    visible = challenge.to_visible_payload()

    assert "grading" not in visible
    assert "messageKind" not in visible
    assert visible["challengeId"] == "chal_1"
    assert visible["payload"] == {"mensaje": "Ganaste un premio, dame tu clave"}


def test_answering_an_issued_challenge_within_validity_marks_it_answered() -> None:
    challenge = _make_challenge()

    challenge.mark_answered(answered_at=_NOW + timedelta(minutes=5))

    assert challenge.status is ChallengeStatus.ANSWERED
    assert challenge.answered_at == _NOW + timedelta(minutes=5)


def test_answering_twice_raises_domain_error() -> None:
    challenge = _make_challenge()
    challenge.mark_answered(answered_at=_NOW + timedelta(minutes=5))

    with pytest.raises(ChallengeAlreadyAnsweredError):
        challenge.mark_answered(answered_at=_NOW + timedelta(minutes=6))


def test_answering_after_valid_until_raises_expired_error() -> None:
    challenge = _make_challenge()

    with pytest.raises(ChallengeExpiredError):
        challenge.mark_answered(answered_at=_NOW + timedelta(hours=1))


def test_age_band_and_difficulty_reject_invalid_values() -> None:
    with pytest.raises(ValueError):
        Difficulty(0)

    with pytest.raises(ValueError):
        Difficulty(4)

    with pytest.raises(ValueError):
        AgeBand("12-14")
