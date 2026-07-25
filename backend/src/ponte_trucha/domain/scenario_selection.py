"""Selección de escenarios: Specification de elegibilidad + Strategy de mezcla.

Sigue `design.md` (backend-serverless): `EligibilitySpecification` filtra
candidatos por banda, dificultad y no repetición; `ScenarioSelectionStrategy`
elige uno evitando monotonía trampa/confianza. Ninguna clase aquí decide
puntaje ni construye un `Challenge`; eso es responsabilidad del caso de uso.

Sin dependencias externas: dominio puro.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from ponte_trucha.domain.progress import Progress
from ponte_trucha.domain.scenario_bank import CuratedScenario
from ponte_trucha.domain.value_objects import AgeBand


@dataclass(frozen=True, slots=True)
class EligibilitySpecification:
    """Un candidato es elegible si coincide con la dificultad vigente y no
    aparece en la ventana reciente del perfil.

    La banda etaria se recibe para dejar el contrato explícito (R3: "elegible
    según progreso, banda y no repetición"); el banco curado actual no separa
    contenido por banda, así que hoy no filtra nada por ese campo. Un banco
    con escenarios exclusivos de banda extenderá esta clase, no la reemplazará.
    """

    def is_satisfied_by(
        self, scenario: CuratedScenario, *, progress: Progress, age_band: AgeBand
    ) -> bool:
        del age_band  # ver docstring: reservado, el banco actual no lo usa aún.
        if scenario.scenario_id in progress.recent_scenario_ids:
            return False
        return scenario.difficulty == progress.current_difficulty


class ScenarioSelectionStrategy(Protocol):
    """Elige un candidato elegible, evitando monotonía trampa/confianza."""

    def select(
        self,
        candidates: tuple[CuratedScenario, ...],
        *,
        progress: Progress,
        random_value: float,
    ) -> CuratedScenario: ...


@dataclass(frozen=True, slots=True)
class RoundRobinScenarioSelectionStrategy:
    """Prefiere el tipo de mensaje distinto al de las dos últimas respuestas.

    Si las últimas dos respuestas fueron del mismo `messageKind`, esta
    estrategia intenta elegir el tipo contrario entre los candidatos elegibles
    para que el niño no memorice un patrón ("siempre viene trampa-trampa-
    confianza"). Si no hay candidatos del tipo contrario, cae de vuelta al
    resto sin romper la ronda.
    """

    def select(
        self,
        candidates: tuple[CuratedScenario, ...],
        *,
        progress: Progress,
        random_value: float,
    ) -> CuratedScenario:
        if not candidates:
            raise ValueError("No hay candidatos elegibles para seleccionar.")

        preferred = _preferred_message_kind(progress)
        pool = (
            tuple(c for c in candidates if c.message_kind == preferred)
            if preferred is not None
            else candidates
        ) or candidates

        index = min(int(random_value * len(pool)), len(pool) - 1)
        return pool[index]


def _preferred_message_kind(progress: Progress) -> str | None:
    recent = progress.recent_message_kinds[-2:]
    if len(recent) < 2 or recent[0] != recent[1]:
        return None
    return "legitimate" if recent[0] == "trap" else "trap"
