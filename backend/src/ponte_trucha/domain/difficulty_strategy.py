"""Adaptación de dificultad: reglas deterministas y explicables (R5).

`StreakDifficultyStrategy` es la única fuente de verdad sobre cuándo subir,
bajar o mantener el nivel. Nunca infiere atributos sensibles ni usa texto
libre; solo cuenta rachas y aciertos recientes.

Sin dependencias externas: dominio puro.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from ponte_trucha.domain.progress import Progress
from ponte_trucha.domain.value_objects import Difficulty

_STREAK_TO_STEP_UP = 3
_RECENT_ERRORS_TO_STEP_DOWN = 3


@dataclass(frozen=True, slots=True)
class DifficultyDecision:
    difficulty: Difficulty
    reason_code: str


class DifficultyStrategy(Protocol):
    def next_difficulty(self, progress: Progress) -> DifficultyDecision: ...


@dataclass(frozen=True, slots=True)
class StreakDifficultyStrategy:
    """Sube tras una racha sostenida, baja tras errores repetidos recientes."""

    streak_to_step_up: int = _STREAK_TO_STEP_UP
    recent_errors_to_step_down: int = _RECENT_ERRORS_TO_STEP_DOWN

    def next_difficulty(self, progress: Progress) -> DifficultyDecision:
        if progress.streak >= self.streak_to_step_up:
            return DifficultyDecision(
                difficulty=progress.current_difficulty.step_up(),
                reason_code="sustained_streak",
            )

        if self._has_repeated_recent_errors(progress):
            return DifficultyDecision(
                difficulty=progress.current_difficulty.step_down(),
                reason_code="repeated_errors",
            )

        return DifficultyDecision(
            difficulty=progress.current_difficulty, reason_code="stable_performance"
        )

    def _has_repeated_recent_errors(self, progress: Progress) -> bool:
        if progress.total_attempts < self.recent_errors_to_step_down:
            return False
        incorrect = progress.total_attempts - progress.correct_attempts
        return progress.streak == 0 and incorrect >= self.recent_errors_to_step_down
