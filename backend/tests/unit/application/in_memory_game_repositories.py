"""Fakes en memoria de retos y progreso, solo para pruebas de aplicación.

No viven en `ponte_trucha.adapters` todavía porque `ChallengeRepository` y
`ProgressRepository` (Fase 3, tarea 15) apuntan a DynamoDB según ADR-003; estos
fakes cubren únicamente la Fase 3 parcial de la tarea 14 (casos de uso con
repositories falsos) hasta que existan los adapters reales.
"""

from __future__ import annotations

from ponte_trucha.domain.challenge import Challenge
from ponte_trucha.domain.progress import Progress
from ponte_trucha.domain.value_objects import Difficulty


class InMemoryChallengeRepository:
    def __init__(self) -> None:
        self._by_child: dict[str, dict[str, Challenge]] = {}

    def get(self, *, child_id: str, challenge_id: str) -> Challenge | None:
        return self._by_child.get(child_id, {}).get(challenge_id)

    def create(self, *, child_id: str, challenge: Challenge) -> None:
        self._by_child.setdefault(child_id, {})[challenge.challenge_id] = challenge

    def save(self, *, child_id: str, challenge: Challenge) -> None:
        self._by_child.setdefault(child_id, {})[challenge.challenge_id] = challenge


class InMemoryProgressRepository:
    def __init__(self) -> None:
        self._by_child: dict[str, Progress] = {}

    def get(self, *, child_id: str) -> Progress:
        return self._by_child.get(
            child_id,
            Progress(
                score=0,
                streak=0,
                total_attempts=0,
                correct_attempts=0,
                current_difficulty=Difficulty(1),
            ),
        )

    def save(self, *, child_id: str, progress: Progress) -> None:
        self._by_child[child_id] = progress
