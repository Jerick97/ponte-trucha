"""Escenario curado: unidad mínima que el banco cargado ofrece a selección.

`CuratedScenario` es la representación de dominio de una entrada del banco
curado (hoy, el JSON de `src/data/escenarios.json`; ver
`ponte_trucha.adapters.curated_scenario_bank` para el loader concreto). No es
lo mismo que `Challenge`: `CuratedScenario` es la plantilla reutilizable,
`Challenge` es la instancia emitida a un niño con `validUntil` y estado propio.

Sin dependencias externas: dominio puro.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from ponte_trucha.domain.channels import AppType
from ponte_trucha.domain.value_objects import Difficulty


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
