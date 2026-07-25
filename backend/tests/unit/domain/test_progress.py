from __future__ import annotations

from ponte_trucha.domain.challenge import MessageKind
from ponte_trucha.domain.progress import Progress
from ponte_trucha.domain.value_objects import Difficulty


def _make_progress(**overrides: object) -> Progress:
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


def test_recording_a_correct_attempt_increases_score_streak_and_history() -> None:
    progress = _make_progress()

    updated = progress.record_attempt(
        scenario_id="escenario_1", message_kind=MessageKind.TRAP, is_correct=True, points=10
    )

    assert updated.score == 10
    assert updated.streak == 1
    assert updated.total_attempts == 1
    assert updated.correct_attempts == 1
    assert "escenario_1" in updated.recent_scenario_ids
    assert updated.recent_message_kinds == (MessageKind.TRAP,)


def test_recording_an_incorrect_attempt_resets_streak_without_negative_score() -> None:
    progress = _make_progress(score=5, streak=3)

    updated = progress.record_attempt(
        scenario_id="escenario_2",
        message_kind=MessageKind.LEGITIMATE,
        is_correct=False,
        points=0,
    )

    assert updated.score == 5
    assert updated.streak == 0
    assert updated.total_attempts == 1
    assert updated.correct_attempts == 0


def test_recent_windows_never_grow_without_bound() -> None:
    progress = _make_progress(
        recent_scenario_ids=tuple(f"escenario_{i}" for i in range(Progress.RECENT_WINDOW)),
        recent_message_kinds=tuple(MessageKind.TRAP for _ in range(Progress.RECENT_WINDOW)),
    )

    updated = progress.record_attempt(
        scenario_id="escenario_nuevo",
        message_kind=MessageKind.LEGITIMATE,
        is_correct=True,
        points=5,
    )

    assert len(updated.recent_scenario_ids) == Progress.RECENT_WINDOW
    assert len(updated.recent_message_kinds) == Progress.RECENT_WINDOW
    assert "escenario_nuevo" in updated.recent_scenario_ids
    assert updated.recent_message_kinds[-1] == MessageKind.LEGITIMATE
