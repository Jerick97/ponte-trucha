from __future__ import annotations

from datetime import UTC, datetime

from ponte_trucha.domain.attempt import Attempt, calculate_points
from ponte_trucha.domain.challenge import MessageKind
from ponte_trucha.domain.channels import AppType
from ponte_trucha.domain.value_objects import Difficulty


def test_points_match_the_existing_frontend_streak_formula() -> None:
    assert calculate_points(is_correct=False, previous_streak=8) == 0
    assert calculate_points(is_correct=True, previous_streak=0) == 100
    assert calculate_points(is_correct=True, previous_streak=2) == 150
    assert calculate_points(is_correct=True, previous_streak=10) == 200


def test_attempt_contains_only_closed_non_identifying_fields() -> None:
    attempt = Attempt(
        attempt_id="attempt-1",
        challenge_id="challenge-1",
        scenario_id="scenario-1",
        app_type=AppType.SMS,
        difficulty=Difficulty(1),
        decision=MessageKind.TRAP,
        is_correct=True,
        points_awarded=100,
        feedback_code="pide-tu-clave",
        response_time_bucket="under-10s",
        answered_at=datetime(2026, 7, 25, 12, 0, tzinfo=UTC),
    )

    assert attempt.is_correct is True
    assert attempt.points_awarded == 100
    assert not hasattr(attempt, "text")
    assert not hasattr(attempt, "child_id")
