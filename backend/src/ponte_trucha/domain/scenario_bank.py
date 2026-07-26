"""Escenario curado: unidad mínima que el banco cargado ofrece a selección.

`CuratedScenario` es la representación de dominio de una entrada del banco
curado (hoy, el JSON de `src/data/escenarios.json`; ver
`ponte_trucha.adapters.curated_scenario_bank` para el loader concreto). No es
lo mismo que `Challenge`: `CuratedScenario` es la plantilla reutilizable,
`Challenge` es la instancia emitida a un niño con `validUntil` y estado propio.

Sin dependencias externas: dominio puro.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any, cast

from ponte_trucha.domain.channels import AppType
from ponte_trucha.domain.value_objects import Difficulty


@dataclass(frozen=True, slots=True)
class ScenarioSignal:
    """Señal delatora visible: el fragmento literal y por qué importa."""

    fragment: str
    explanation: str


@dataclass(frozen=True, slots=True)
class ScammerProfile:
    """Semilla del personaje. Solo presión por la estafa, nunca acoso."""

    disguise: str
    tactics: tuple[str, ...]
    objective: str


@dataclass(frozen=True, slots=True)
class ScenarioReveal:
    """Contenido educativo que el cliente recibe **solo después** del intento.

    Antes de responder, el reto viaja sin nada de esto: ni el tipo, ni las
    señales, ni la lección, ni el perfil del estafador. La UI necesita el
    fragmento literal para resaltarlo dentro de la burbuja, así que un código
    slug no alcanza; por eso el texto vive aquí y no en el cliente.
    """

    scenario_type: str
    signals: tuple[ScenarioSignal, ...]
    lesson: str
    allows_conversation: bool
    scammer_profile: ScammerProfile | None = None

    def to_snapshot(self) -> dict[str, Any]:
        snapshot: dict[str, Any] = {
            "scenarioType": self.scenario_type,
            "signals": [
                {"fragment": signal.fragment, "explanation": signal.explanation}
                for signal in self.signals
            ],
            "lesson": self.lesson,
            "allowsConversation": self.allows_conversation,
        }
        if self.scammer_profile is not None:
            snapshot["scammerProfile"] = {
                "disguise": self.scammer_profile.disguise,
                "tactics": list(self.scammer_profile.tactics),
                "objective": self.scammer_profile.objective,
            }
        return snapshot

    @classmethod
    def from_snapshot(cls, snapshot: Mapping[str, Any]) -> ScenarioReveal:
        raw_signals = cast("list[Mapping[str, Any]]", snapshot.get("signals") or [])
        raw_profile = snapshot.get("scammerProfile")
        profile = None
        if isinstance(raw_profile, Mapping):
            profile_map = cast("Mapping[str, Any]", raw_profile)
            profile = ScammerProfile(
                disguise=str(profile_map["disguise"]),
                tactics=tuple(str(tactic) for tactic in profile_map.get("tactics", ())),
                objective=str(profile_map["objective"]),
            )
        return cls(
            scenario_type=str(snapshot["scenarioType"]),
            signals=tuple(
                ScenarioSignal(
                    fragment=str(signal["fragment"]),
                    explanation=str(signal["explanation"]),
                )
                for signal in raw_signals
            ),
            lesson=str(snapshot["lesson"]),
            allows_conversation=bool(snapshot["allowsConversation"]),
            scammer_profile=profile,
        )


@dataclass(frozen=True, slots=True)
class CuratedScenario:
    scenario_id: str
    scenario_version: int
    app_type: AppType
    difficulty: Difficulty
    message_kind: str
    """`"trap"` o `"legitimate"` (valores de `MessageKind`).

    Se declara como `str` y no como `MessageKind` para que este módulo no
    necesite importar `challenge.py`; ambos son intercambiables porque
    `MessageKind` extiende `str`.
    """
    payload: dict[str, Any]
    grading_signal_codes: tuple[str, ...]
    grading_feedback_code: str
    reveal: ScenarioReveal
