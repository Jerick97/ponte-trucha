"""Guardrails de contenido generado: la última barrera antes de un niño.

Regla de estas pruebas: todo lo que el banco curado ya acepta debe pasar, y
todo lo que rompa el contrato de contenido o el ámbito del producto debe caer.
Un guardrail que rechaza contenido bueno es tan malo como uno que aprueba
contenido malo: el primero apaga la IA, el segundo la vuelve peligrosa.
"""

from __future__ import annotations

from typing import Any

import pytest

from ponte_trucha.adapters.curated_scenario_bank import load_curated_scenario_bank
from ponte_trucha.domain.channels import AppType
from ponte_trucha.domain.guardrails import (
    GuardrailChain,
    ScenarioRequest,
)
from ponte_trucha.domain.scenario_bank import (
    CuratedScenario,
    ScammerProfile,
    ScenarioReveal,
    ScenarioSignal,
)
from ponte_trucha.domain.value_objects import AgeBand, Difficulty

MENSAJE_TRAMPA = (
    "Oe, soy del equipo del juego. Pon tu contraseña aquí y te mando 10000 monedas ahorita."
)


def escenario(**cambios: Any) -> CuratedScenario:
    """Escenario de trampa válido; cada prueba rompe un solo campo."""

    payload: dict[str, Any] = {
        "canal": "chat-juego",
        "dificultad": 1,
        "remitente": {"nombre": "EquipoOficial_777", "avatar": "👑", "verificado": False},
        "mensaje": MENSAJE_TRAMPA,
    }
    payload.update(cambios.pop("payload", {}))

    reveal_cambios: dict[str, Any] = cambios.pop("reveal", {})
    reveal = ScenarioReveal(
        scenario_type=reveal_cambios.pop("scenario_type", "monedas-gratis"),
        signals=reveal_cambios.pop(
            "signals",
            (
                ScenarioSignal(
                    fragment="tu contraseña",
                    explanation="Nadie que sea de verdad te pide tu clave.",
                ),
            ),
        ),
        lesson=reveal_cambios.pop("lesson", "Nadie regala monedas a cambio de tu contraseña."),
        allows_conversation=reveal_cambios.pop("allows_conversation", True),
        scammer_profile=reveal_cambios.pop(
            "scammer_profile",
            ScammerProfile(
                disguise="alguien del equipo del juego",
                tactics=("prisa", "premio"),
                objective="conseguir la contraseña",
            ),
        ),
    )

    return CuratedScenario(
        scenario_id=cambios.pop("scenario_id", "ia-monedas-gratis-1"),
        scenario_version=1,
        app_type=cambios.pop("app_type", AppType.ROBLOX),
        difficulty=cambios.pop("difficulty", Difficulty(1)),
        message_kind=cambios.pop("message_kind", "trap"),
        payload=payload,
        grading_signal_codes=("tu-contrasena",),
        grading_feedback_code="nadie-regala-monedas",
        reveal=reveal,
    )


def peticion(**cambios: Any) -> ScenarioRequest:
    return ScenarioRequest(
        app_type=cambios.pop("app_type", AppType.ROBLOX),
        difficulty=cambios.pop("difficulty", Difficulty(1)),
        age_band=cambios.pop("age_band", AgeBand.EIGHT_TO_TEN),
        message_kind=cambios.pop("message_kind", "trap"),
    )


CADENA = GuardrailChain.with_default_rules()


def test_un_escenario_bien_formado_pasa_la_cadena() -> None:
    assert CADENA.evaluate(escenario(), peticion()) is None


def test_todo_el_banco_curado_pasa_la_cadena() -> None:
    """Si un guardrail rechaza contenido de Clau, el guardrail está mal."""

    for curado in load_curated_scenario_bank():
        rechazo = CADENA.evaluate(
            curado,
            ScenarioRequest(
                app_type=curado.app_type,
                difficulty=curado.difficulty,
                age_band=AgeBand.EIGHT_TO_TEN,
                message_kind=curado.message_kind,
            ),
        )
        assert rechazo is None, f"{curado.scenario_id}: {rechazo}"


def test_rechaza_un_canal_distinto_al_pedido() -> None:
    rechazo = CADENA.evaluate(escenario(), peticion(app_type=AppType.WHATSAPP))

    assert rechazo is not None
    assert rechazo.code == "request_mismatch"


def test_rechaza_una_dificultad_distinta_a_la_pedida() -> None:
    rechazo = CADENA.evaluate(escenario(), peticion(difficulty=Difficulty(3)))

    assert rechazo is not None
    assert rechazo.code == "request_mismatch"


def test_rechaza_un_tipo_de_mensaje_distinto_al_pedido() -> None:
    rechazo = CADENA.evaluate(escenario(), peticion(message_kind="legitimate"))

    assert rechazo is not None
    assert rechazo.code == "request_mismatch"


def test_rechaza_un_mensaje_que_no_cabe_en_una_burbuja() -> None:
    rechazo = CADENA.evaluate(escenario(payload={"mensaje": "a" * 241}), peticion())

    assert rechazo is not None
    assert rechazo.code == "text_limits"


def test_rechaza_una_leccion_demasiado_larga() -> None:
    rechazo = CADENA.evaluate(escenario(reveal={"lesson": "x" * 121}), peticion())

    assert rechazo is not None
    assert rechazo.code == "text_limits"


def test_rechaza_una_senal_que_no_aparece_literal_en_el_mensaje() -> None:
    rechazo = CADENA.evaluate(
        escenario(reveal={"signals": (ScenarioSignal("tu tarjeta", "explicación suficiente"),)}),
        peticion(),
    )

    assert rechazo is not None
    assert rechazo.code == "signals_not_literal"


def test_rechaza_un_escenario_sin_senales() -> None:
    rechazo = CADENA.evaluate(escenario(reveal={"signals": ()}), peticion())

    assert rechazo is not None
    assert rechazo.code == "text_limits"


def test_rechaza_un_tipo_de_escenario_fuera_del_catalogo() -> None:
    rechazo = CADENA.evaluate(escenario(reveal={"scenario_type": "estafa-nueva"}), peticion())

    assert rechazo is not None
    assert rechazo.code == "unknown_scenario_type"


def test_rechaza_una_trampa_declarada_como_legitima() -> None:
    rechazo = CADENA.evaluate(escenario(reveal={"scenario_type": "legitimo"}), peticion())

    assert rechazo is not None
    assert rechazo.code == "verdict_inconsistent"


def test_rechaza_un_legitimo_que_ofrece_conversacion() -> None:
    rechazo = CADENA.evaluate(
        escenario(
            message_kind="legitimate",
            reveal={
                "scenario_type": "legitimo",
                "allows_conversation": True,
                "scammer_profile": None,
            },
        ),
        peticion(message_kind="legitimate"),
    )

    assert rechazo is not None
    assert rechazo.code == "verdict_inconsistent"


def test_rechaza_una_conversacion_sin_perfil_del_personaje() -> None:
    rechazo = CADENA.evaluate(escenario(reveal={"scammer_profile": None}), peticion())

    assert rechazo is not None
    assert rechazo.code == "conversation_without_profile"


def test_exige_asunto_en_correo_y_lo_prohibe_en_los_demas_canales() -> None:
    sin_asunto = CADENA.evaluate(
        escenario(
            app_type=AppType.EMAIL,
            payload={"canal": "correo"},
        ),
        peticion(app_type=AppType.EMAIL),
    )
    con_asunto_de_mas = CADENA.evaluate(
        escenario(payload={"asunto": "Ganaste un premio"}), peticion()
    )

    assert sin_asunto is not None and sin_asunto.code == "channel_fields"
    assert con_asunto_de_mas is not None and con_asunto_de_mas.code == "channel_fields"


@pytest.mark.parametrize(
    "leccion",
    [
        pytest.param("Así funciona el phishing y no hay que caer.", id="phishing"),
        pytest.param("Ese archivo trae malware y roba la cuenta.", id="malware"),
        pytest.param("Te pueden hackear la cuenta si das tu clave.", id="hackear"),
        pytest.param("Cuidado, esto es un peligro para tu cuenta.", id="peligro"),
        pytest.param("Un ciberdelincuente quiere entrar a tu cuenta.", id="ciberdelincuente"),
    ],
)
def test_rechaza_vocabulario_prohibido_en_la_voz_del_juego(leccion: str) -> None:
    rechazo = CADENA.evaluate(escenario(reveal={"lesson": leccion}), peticion())

    assert rechazo is not None
    assert rechazo.code == "forbidden_vocabulary"


def test_el_personaje_si_puede_usar_jerga_porque_asi_hablan_las_estafas() -> None:
    """El banco curado ya lo hace: "detectamos un hackeo en tu cuenta"."""

    rechazo = CADENA.evaluate(
        escenario(
            payload={
                "mensaje": (
                    "Soy del equipo. Detectamos un hackeo y necesito tu contraseña "
                    "para proteger la cuenta."
                )
            }
        ),
        peticion(),
    )

    assert rechazo is None


@pytest.mark.parametrize(
    "texto",
    [
        pytest.param("Mándame una foto sin ropa", id="sexual"),
        pytest.param("Si no me haces caso te voy a golpear", id="violencia"),
        pytest.param("Te consigo droga barata", id="drogas"),
        pytest.param("Nadie te quiere, mejor cortarte las venas", id="autolesion"),
        pytest.param("Dime la dirección de tu casa y nos vemos en persona", id="encuentro"),
        pytest.param("Llámame al 987654321 ahora", id="telefono-real"),
    ],
)
def test_rechaza_temas_fuera_del_ambito_del_producto(texto: str) -> None:
    rechazo = CADENA.evaluate(
        escenario(payload={"mensaje": f"{texto}. Pon tu contraseña y te doy monedas."}),
        peticion(),
    )

    assert rechazo is not None
    assert rechazo.code == "out_of_scope"


def test_el_ambito_se_revisa_tambien_en_la_leccion_y_las_senales() -> None:
    rechazo = CADENA.evaluate(
        escenario(reveal={"lesson": "Nadie te manda una foto sin ropa por monedas."}),
        peticion(),
    )

    assert rechazo is not None
    assert rechazo.code == "out_of_scope"


def test_la_cadena_reporta_el_primer_rechazo_y_no_sigue() -> None:
    """Un solo código por rechazo: sirve para métricas de baja cardinalidad."""

    rechazo = CADENA.evaluate(
        escenario(payload={"mensaje": "corto"}, reveal={"scenario_type": "estafa-nueva"}),
        peticion(),
    )

    assert rechazo is not None
    assert rechazo.code == "text_limits"
