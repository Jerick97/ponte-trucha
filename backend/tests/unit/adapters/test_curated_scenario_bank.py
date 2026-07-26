from __future__ import annotations

from ponte_trucha.adapters.curated_scenario_bank import load_curated_scenario_bank
from ponte_trucha.domain.challenge import MessageKind
from ponte_trucha.domain.channels import AppType


def test_loads_every_scenario_from_the_json_bank_with_mapped_channel_and_kind() -> None:
    bank = load_curated_scenario_bank()

    assert len(bank) > 0
    ids = {scenario.scenario_id for scenario in bank}
    assert "codigo-verificacion-real" in ids

    legit = next(s for s in bank if s.scenario_id == "codigo-verificacion-real")
    assert legit.message_kind == MessageKind.LEGITIMATE
    assert legit.app_type == AppType.SMS
    assert legit.grading_signal_codes == ()


def test_maps_trap_scenarios_with_non_empty_signal_codes() -> None:
    bank = load_curated_scenario_bank()

    trap = next(s for s in bank if s.scenario_id == "robux-gratis-contrasena")
    assert trap.message_kind == MessageKind.TRAP
    assert len(trap.grading_signal_codes) > 0
    assert trap.grading_feedback_code


def test_payload_never_includes_grading_fields() -> None:
    bank = load_curated_scenario_bank()

    for scenario in bank:
        assert "respuestaCorrecta" not in scenario.payload
        assert "senales" not in scenario.payload
        assert "leccion" not in scenario.payload


def test_serves_every_channel_of_the_content_bank() -> None:
    """El teléfono tiene cinco canales y el API sirve los cinco.

    `chat-juego` se mapea a la app Roblox y `discord` ya tiene su propio
    `AppType`, así que ningún escenario curado queda fuera del juego.
    """
    bank = load_curated_scenario_bank()

    assert any(scenario.scenario_id == "admin-pide-clave" for scenario in bank)
    assert {scenario.app_type for scenario in bank} >= {AppType.DISCORD, AppType.ROBLOX}


def test_reveal_carries_readable_signals_and_lesson() -> None:
    bank = load_curated_scenario_bank()

    trap = next(s for s in bank if s.scenario_id == "robux-gratis-contrasena")

    assert trap.reveal.scenario_type != "legitimo"
    assert trap.reveal.lesson
    assert all(signal.fragment and signal.explanation for signal in trap.reveal.signals)
    assert trap.reveal.allows_conversation is True
    assert trap.reveal.scammer_profile is not None


def test_payload_hides_the_reveal_fields() -> None:
    """Solo las estafas dejan conversar: verlo antes de decidir sería una pista."""

    bank = load_curated_scenario_bank()

    for scenario in bank:
        assert "permiteConversacion" not in scenario.payload
        assert "tipo" not in scenario.payload
        assert "perfilEstafador" not in scenario.payload
