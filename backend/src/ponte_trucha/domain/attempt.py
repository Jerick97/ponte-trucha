"""Intento calificado y fórmula autoritativa de puntaje.

Solo contiene decisiones cerradas y metadatos mínimos. Nunca admite texto del
niño, identidad, payloads HTTP ni contenido de conversación.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum

from ponte_trucha.domain.challenge import MessageKind
from ponte_trucha.domain.channels import AppType
from ponte_trucha.domain.value_objects import Difficulty

_BASE_POINTS = 100
_STREAK_BONUS = 25
_MAX_STREAK_BONUS = 100


class ResponseTimeBucket(StrEnum):
    UNDER_TEN_SECONDS = "under-10s"
    TEN_TO_THIRTY_SECONDS = "10-30s"
    OVER_THIRTY_SECONDS = "over-30s"
    UNKNOWN = "unknown"


def calculate_points(*, is_correct: bool, previous_streak: int) -> int:
    if not is_correct:
        return 0
    return _BASE_POINTS + min(previous_streak * _STREAK_BONUS, _MAX_STREAK_BONUS)


@dataclass(frozen=True, slots=True)
class Attempt:
    attempt_id: str
    challenge_id: str
    scenario_id: str
    app_type: AppType
    difficulty: Difficulty
    decision: MessageKind
    is_correct: bool
    points_awarded: int
    feedback_code: str
    response_time_bucket: ResponseTimeBucket | str
    answered_at: datetime
