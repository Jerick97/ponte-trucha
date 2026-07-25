"""Entidad `Progress`: resumen autoritativo del avance de un perfil infantil.

Refleja el modelo lógico de ADR-003 (`Progress` bajo `CHILD#{childId}`). Es
inmutable: cada intento produce una nueva instancia, nunca muta en el sitio,
para que los casos de uso puedan aplicar control de concurrencia optimista
sobre `revision` sin ambigüedad sobre qué valor se leyó.

Sin dependencias externas: dominio puro.
"""

from __future__ import annotations

from dataclasses import dataclass, replace

from ponte_trucha.domain.challenge import MessageKind
from ponte_trucha.domain.value_objects import Difficulty


@dataclass(frozen=True, slots=True)
class Progress:
    """Ventana acotada de resultados recientes, nunca un historial completo."""

    RECENT_WINDOW = 10

    score: int
    streak: int
    total_attempts: int
    correct_attempts: int
    current_difficulty: Difficulty
    recent_scenario_ids: tuple[str, ...] = ()
    recent_message_kinds: tuple[MessageKind, ...] = ()

    def record_attempt(
        self, *, scenario_id: str, message_kind: MessageKind, is_correct: bool, points: int
    ) -> Progress:
        new_recent_ids = (*self.recent_scenario_ids, scenario_id)[-self.RECENT_WINDOW :]
        new_recent_kinds = (*self.recent_message_kinds, message_kind)[-self.RECENT_WINDOW :]

        return replace(
            self,
            score=self.score + points if is_correct else self.score,
            streak=self.streak + 1 if is_correct else 0,
            total_attempts=self.total_attempts + 1,
            correct_attempts=self.correct_attempts + (1 if is_correct else 0),
            recent_scenario_ids=new_recent_ids,
            recent_message_kinds=new_recent_kinds,
        )
