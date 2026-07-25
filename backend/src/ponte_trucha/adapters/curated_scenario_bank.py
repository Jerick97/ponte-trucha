"""Carga el banco curado (`src/data/escenarios.json`) como `CuratedScenario`.

El banco de contenido es propiedad de Clau y vive en el repo del frontend
(fuente de verdad única: `src/data/escenarios.json` + `escenarios.schema.json`,
ver `.agents/skills/escenario-trucha`). Este adapter solo lo traduce a
dominio; nunca lo reescribe ni lo valida de nuevo (esa validación ya la cubre
`npm run validar:escenarios`).

Mapeo canal → `AppType`: R3 solo aprueba `roblox`, `sms`, `email` y
`whatsapp`. El banco de contenido incluye también `discord` y `chat-juego`;
`chat-juego` se mapea a `roblox` porque `appPorCanal` del frontend
(`src/components/telefono/apps.ts`) lo renderiza como la app Roblox. Los
escenarios de canal `discord` se excluyen hasta que exista una decisión
explícita que amplíe R3 con un quinto canal.
"""

from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

from ponte_trucha.domain.channels import AppType
from ponte_trucha.domain.scenario_bank import CuratedScenario
from ponte_trucha.domain.value_objects import Difficulty

_CHANNEL_TO_APP_TYPE: dict[str, AppType] = {
    "whatsapp": AppType.WHATSAPP,
    "sms": AppType.SMS,
    "correo": AppType.EMAIL,
    "chat-juego": AppType.ROBLOX,
}

# Campos del escenario JSON que son calificación (grading) y nunca deben
# llegar al `payload` visible que ve el cliente antes de responder.
_GRADING_ONLY_FIELDS = frozenset({"respuestaCorrecta", "senales", "leccion", "perfilEstafador"})

_BUNDLED_BANK_PATH = Path(__file__).parent / "data" / "escenarios.json"
_MONOREPO_BANK_PATH = Path(__file__).parents[4] / "src" / "data" / "escenarios.json"
_BANK_PATH_ENV = "CURATED_SCENARIO_BANK_PATH"


def _bank_path() -> Path:
    """Resuelve dónde leer el banco, en orden de prioridad:

    1. `CURATED_SCENARIO_BANK_PATH`: override explícito (tests, entornos).
    2. Copia empaquetada junto al adapter (`adapters/data/escenarios.json`):
       la que incluye `scripts/package_lambdas.py` dentro del zip de Lambda.
    3. Ruta del monorepo (`../../src/data/escenarios.json`): solo funciona en
       desarrollo local, donde el checkout completo del frontend existe junto
       al backend.
    """
    override = os.environ.get(_BANK_PATH_ENV)
    if override:
        return Path(override)
    if _BUNDLED_BANK_PATH.exists():
        return _BUNDLED_BANK_PATH
    return _MONOREPO_BANK_PATH


def _to_curated_scenario(raw: dict[str, Any]) -> CuratedScenario | None:
    app_type = _CHANNEL_TO_APP_TYPE.get(raw["canal"])
    if app_type is None:
        return None

    is_trap = raw["respuestaCorrecta"] == "trampa"
    signal_codes = tuple(_slug(signal["fragmento"]) for signal in raw["senales"]) if is_trap else ()
    payload = {
        key: value for key, value in raw.items() if key not in _GRADING_ONLY_FIELDS and key != "id"
    }

    return CuratedScenario(
        scenario_id=raw["id"],
        scenario_version=1,
        app_type=app_type,
        difficulty=Difficulty(raw["dificultad"]),
        message_kind="trap" if is_trap else "legitimate",
        payload=payload,
        grading_signal_codes=signal_codes,
        grading_feedback_code=_slug(raw["leccion"]),
    )


def _slug(text: str) -> str:
    ascii_text = (
        text.lower()
        .replace("á", "a")
        .replace("é", "e")
        .replace("í", "i")
        .replace("ó", "o")
        .replace("ú", "u")
        .replace("ñ", "n")
    )
    kept = "".join(char if char.isalnum() else " " for char in ascii_text)
    return "-".join(kept.split())[:64]


@lru_cache(maxsize=1)
def load_curated_scenario_bank() -> tuple[CuratedScenario, ...]:
    """Carga y traduce el banco curado una sola vez por proceso Lambda."""

    raw_bank = json.loads(_bank_path().read_text(encoding="utf-8"))
    scenarios = (_to_curated_scenario(entry) for entry in raw_bank["escenarios"])
    return tuple(scenario for scenario in scenarios if scenario is not None)
