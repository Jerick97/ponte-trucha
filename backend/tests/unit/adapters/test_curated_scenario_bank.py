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


def test_excludes_channels_not_yet_approved_in_r3() -> None:
    """R3 solo aprueba roblox, sms, email y whatsapp. El banco de contenido
    incluye un escenario de canal `discord` (admin-pide-clave) que todavía no
    tiene `AppType`; se excluye hasta que una spec lo apruebe explícitamente.
    """
    bank = load_curated_scenario_bank()

    assert all(scenario.scenario_id != "admin-pide-clave" for scenario in bank)
