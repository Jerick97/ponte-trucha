from __future__ import annotations

from ponte_trucha.domain.channels import AppType
from ponte_trucha.domain.progress import Progress
from ponte_trucha.domain.scenario_bank import CuratedScenario, ScenarioReveal, ScenarioSignal
from ponte_trucha.domain.scenario_selection import (
    EligibilitySpecification,
    RoundRobinScenarioSelectionStrategy,
)
from ponte_trucha.domain.value_objects import AgeBand, Difficulty


def _scenario(**overrides: object) -> CuratedScenario:
    defaults: dict[str, object] = {
        "scenario_id": "escenario-1",
        "scenario_version": 1,
        "app_type": AppType.SMS,
        "difficulty": Difficulty(1),
        "message_kind": "trap",
        "payload": {"mensaje": "hola"},
        "grading_signal_codes": ("pide-clave",),
        "grading_feedback_code": "pide-clave-nunca",
        "reveal": ScenarioReveal(
            scenario_type="robo-de-cuenta",
            signals=(ScenarioSignal(fragment="tu clave", explanation="Nadie pide tu clave."),),
            lesson="Nadie que sea de verdad te pide tu clave.",
            allows_conversation=False,
        ),
    }
    defaults.update(overrides)
    return CuratedScenario(**defaults)  # type: ignore[arg-type]


def _progress(**overrides: object) -> Progress:
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


def test_eligibility_excludes_recently_seen_scenarios() -> None:
    spec = EligibilitySpecification()
    scenario = _scenario(scenario_id="repetido")
    progress = _progress(recent_scenario_ids=("repetido",))

    assert not spec.is_satisfied_by(scenario, progress=progress, age_band=AgeBand.EIGHT_TO_TEN)


def test_eligibility_requires_matching_difficulty() -> None:
    spec = EligibilitySpecification()
    scenario = _scenario(difficulty=Difficulty(3))
    progress = _progress(current_difficulty=Difficulty(1))

    assert not spec.is_satisfied_by(scenario, progress=progress, age_band=AgeBand.EIGHT_TO_TEN)


def test_eligible_scenario_passes_when_unseen_and_matching_difficulty() -> None:
    spec = EligibilitySpecification()
    scenario = _scenario(difficulty=Difficulty(1))
    progress = _progress(current_difficulty=Difficulty(1))

    assert spec.is_satisfied_by(scenario, progress=progress, age_band=AgeBand.EIGHT_TO_TEN)


def test_selection_strategy_avoids_repeating_the_same_message_kind_twice_in_a_row() -> None:
    strategy = RoundRobinScenarioSelectionStrategy()
    candidates = (
        _scenario(scenario_id="trampa-1", message_kind="trap"),
        _scenario(scenario_id="legit-1", message_kind="legitimate"),
    )
    progress = _progress(recent_message_kinds=("trap", "trap"))

    chosen = strategy.select(candidates, progress=progress, random_value=0.0)

    assert chosen.scenario_id == "legit-1"


def test_selection_strategy_falls_back_to_any_candidate_when_only_one_kind_available() -> None:
    strategy = RoundRobinScenarioSelectionStrategy()
    candidates = (_scenario(scenario_id="trampa-1", message_kind="trap"),)
    progress = _progress(recent_message_kinds=("trap", "trap"))

    chosen = strategy.select(candidates, progress=progress, random_value=0.0)

    assert chosen.scenario_id == "trampa-1"
