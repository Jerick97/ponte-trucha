from __future__ import annotations

from ponte_trucha.domain.difficulty_strategy import StreakDifficultyStrategy
from ponte_trucha.domain.progress import Progress
from ponte_trucha.domain.value_objects import Difficulty


def _progress(**overrides: object) -> Progress:
    defaults: dict[str, object] = {
        "score": 0,
        "streak": 0,
        "total_attempts": 0,
        "correct_attempts": 0,
        "current_difficulty": Difficulty(1),
        "recent_scenario_ids": (),
        "recent_message_kinds": (),
    }
    defaults.update(overrides)
    return Progress(**defaults)  # type: ignore[arg-type]


def test_sustained_streak_steps_difficulty_up_with_reason_code() -> None:
    strategy = StreakDifficultyStrategy()
    progress = _progress(streak=3, current_difficulty=Difficulty(1))

    decision = strategy.next_difficulty(progress)

    assert decision.difficulty == Difficulty(2)
    assert decision.reason_code == "sustained_streak"


def test_repeated_errors_step_difficulty_down_with_reason_code() -> None:
    strategy = StreakDifficultyStrategy()
    progress = _progress(
        streak=0,
        current_difficulty=Difficulty(2),
        total_attempts=3,
        correct_attempts=0,
    )

    decision = strategy.next_difficulty(progress)

    assert decision.difficulty == Difficulty(1)
    assert decision.reason_code == "repeated_errors"


def test_stable_performance_keeps_current_difficulty() -> None:
    strategy = StreakDifficultyStrategy()
    progress = _progress(
        streak=1,
        current_difficulty=Difficulty(2),
        total_attempts=2,
        correct_attempts=1,
    )

    decision = strategy.next_difficulty(progress)

    assert decision.difficulty == Difficulty(2)
    assert decision.reason_code == "stable_performance"


def test_never_exceeds_difficulty_bounds() -> None:
    strategy = StreakDifficultyStrategy()
    at_max = _progress(streak=5, current_difficulty=Difficulty(3))
    at_min = _progress(
        streak=0, current_difficulty=Difficulty(1), total_attempts=3, correct_attempts=0
    )

    assert strategy.next_difficulty(at_max).difficulty == Difficulty(3)
    assert strategy.next_difficulty(at_min).difficulty == Difficulty(1)
