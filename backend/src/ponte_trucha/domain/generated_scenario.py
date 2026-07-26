"""Escenario generado por IA y su ciclo de vida.

`arquitectura.md` pide una máquina de estados explícita para el escenario
(borrador, publicado, retirado). El motivo es de producto, no de estética: la
IA propone, los guardrails filtran y una persona decide qué llega a un niño.
Nada nace publicado.

Guarda el candidato en su forma original (claves en español, igual que
`src/data/escenarios.json`) para poder revisarlo, reconstruirlo y republicarlo
sin volver a pagar una generación.

Sin dependencias externas: dominio puro.
"""

from __future__ import annotations

from dataclasses import dataclass, replace
from enum import StrEnum
from typing import Any

from ponte_trucha.domain.channels import AppType
from ponte_trucha.domain.errors import DomainError
from ponte_trucha.domain.scenario_bank import CuratedScenario
from ponte_trucha.domain.value_objects import Difficulty


class GeneratedScenarioState(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    RETIRED = "retired"


class InvalidScenarioTransitionError(DomainError):
    """Se intentó una transición que la máquina de estados no permite."""

    code = "INVALID_SCENARIO_TRANSITION"


@dataclass(frozen=True, slots=True)
class GeneratedScenarioRecord:
    scenario_id: str
    state: GeneratedScenarioState
    app_type: AppType
    difficulty: Difficulty
    message_kind: str
    """`"trap"` o `"legitimate"`, igual que `CuratedScenario.message_kind`."""
    raw: dict[str, Any]
    """Candidato tal como lo devolvió el modelo, ya validado por guardrails."""
    model_id: str
    created_at: str
    updated_at: str

    @classmethod
    def draft(
        cls,
        *,
        scenario_id: str,
        app_type: AppType,
        difficulty: Difficulty,
        message_kind: str,
        raw: dict[str, Any],
        model_id: str,
        now: str,
    ) -> GeneratedScenarioRecord:
        return cls(
            scenario_id=scenario_id,
            state=GeneratedScenarioState.DRAFT,
            app_type=app_type,
            difficulty=difficulty,
            message_kind=message_kind,
            raw=raw,
            model_id=model_id,
            created_at=now,
            updated_at=now,
        )

    def publish(self, *, now: str) -> GeneratedScenarioRecord:
        """Solo un borrador o algo retirado se puede publicar."""

        if self.state is GeneratedScenarioState.PUBLISHED:
            raise InvalidScenarioTransitionError("El escenario ya está publicado.")
        return replace(self, state=GeneratedScenarioState.PUBLISHED, updated_at=now)

    def retire(self, *, now: str) -> GeneratedScenarioRecord:
        """Retirar saca el escenario de circulación sin borrar su historia."""

        if self.state is GeneratedScenarioState.RETIRED:
            raise InvalidScenarioTransitionError("El escenario ya está retirado.")
        return replace(self, state=GeneratedScenarioState.RETIRED, updated_at=now)

    @property
    def is_published(self) -> bool:
        return self.state is GeneratedScenarioState.PUBLISHED


@dataclass(frozen=True, slots=True)
class GeneratedCandidate:
    """Salida del generador: el escenario de dominio y su JSON original.

    Se conservan los dos porque cumplen funciones distintas: el escenario es lo
    que evalúan los guardrails y lo que sirve el juego; el JSON es lo que una
    persona revisa y lo que permite reconstruirlo sin volver a generar.
    """

    scenario: CuratedScenario
    raw: dict[str, Any]
