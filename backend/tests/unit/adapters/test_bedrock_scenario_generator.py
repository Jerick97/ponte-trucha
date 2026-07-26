"""Contract test del generador Bedrock, con un cliente falso en vez de red.

Interesa el contrato del adapter: qué manda (y qué NO manda) en el prompt, y qué
hace con respuestas imperfectas de un modelo. La llamada real a Bedrock se
verifica aparte, con credenciales, en `scripts/generar_escenarios.py`.
"""

from __future__ import annotations

import json
from typing import Any

import pytest

from ponte_trucha.adapters.bedrock_scenario_generator import (
    BedrockScenarioGenerator,
    build_user_prompt,
)
from ponte_trucha.domain.channels import AppType
from ponte_trucha.domain.errors import ScenarioGenerationError
from ponte_trucha.domain.guardrails import ScenarioRequest
from ponte_trucha.domain.value_objects import AgeBand, Difficulty

CANDIDATO: dict[str, Any] = {
    "tipo": "monedas-gratis",
    "canal": "chat-juego",
    "dificultad": 1,
    "remitente": {"nombre": "RobuxKing_Oficial", "avatar": "👑", "verificado": False},
    "mensaje": "Pon tu contraseña aquí y te mando 10000 monedas ahorita, solo faltas tú.",
    "respuestaCorrecta": "trampa",
    "senales": [
        {
            "fragmento": "tu contraseña",
            "explicacion": "Nadie que sea de verdad te pide tu clave.",
        }
    ],
    "leccion": "Nadie regala monedas a cambio de tu contraseña.",
    "permiteConversacion": True,
    "perfilEstafador": {
        "disfraz": "un jugador famoso",
        "tacticas": ["prisa", "premio"],
        "objetivo": "conseguir la contraseña",
    },
}


class ClienteFalso:
    """Captura lo que se le manda y devuelve el texto que le indiquen."""

    def __init__(self, texto: str) -> None:
        self.texto = texto
        self.llamadas: list[dict[str, Any]] = []

    def converse(
        self,
        *,
        modelId: str,  # noqa: N803 - firma de la API de AWS
        system: list[dict[str, Any]],
        messages: list[dict[str, Any]],
        inferenceConfig: dict[str, Any],  # noqa: N803 - firma de la API de AWS
    ) -> dict[str, Any]:
        self.llamadas.append(
            {
                "modelId": modelId,
                "system": system,
                "messages": messages,
                "inferenceConfig": inferenceConfig,
            }
        )
        return {"output": {"message": {"role": "assistant", "content": [{"text": self.texto}]}}}


class ClienteQueFalla:
    def converse(
        self,
        *,
        modelId: str,  # noqa: N803 - firma de la API de AWS
        system: list[dict[str, Any]],
        messages: list[dict[str, Any]],
        inferenceConfig: dict[str, Any],  # noqa: N803 - firma de la API de AWS
    ) -> dict[str, Any]:
        del modelId, system, messages, inferenceConfig
        raise RuntimeError("respuesta privada que nunca debe propagarse")


def peticion(**cambios: Any) -> ScenarioRequest:
    return ScenarioRequest(
        app_type=cambios.pop("app_type", AppType.ROBLOX),
        difficulty=cambios.pop("difficulty", Difficulty(1)),
        age_band=cambios.pop("age_band", AgeBand.EIGHT_TO_TEN),
        message_kind=cambios.pop("message_kind", "trap"),
    )


def test_construye_un_escenario_de_dominio_desde_el_json_del_modelo() -> None:
    cliente = ClienteFalso(json.dumps(CANDIDATO, ensure_ascii=False))
    generador = BedrockScenarioGenerator(client=cliente)

    escenario = generador.generate(request=peticion(), scenario_id="ia-1")

    assert escenario.scenario_id == "ia-1"
    assert escenario.app_type is AppType.ROBLOX
    assert escenario.difficulty == Difficulty(1)
    assert escenario.message_kind == "trap"
    assert escenario.payload["mensaje"].startswith("Pon tu contraseña")
    assert escenario.reveal.signals[0].fragment == "tu contraseña"
    assert escenario.reveal.scammer_profile is not None


def test_el_id_lo_decide_quien_pide_no_el_modelo() -> None:
    cliente = ClienteFalso(json.dumps({**CANDIDATO, "id": "id-inventado-por-el-modelo"}))
    generador = BedrockScenarioGenerator(client=cliente)

    escenario = generador.generate(request=peticion(), scenario_id="ia-2")

    assert escenario.scenario_id == "ia-2"


def test_el_payload_visible_no_incluye_la_calificacion() -> None:
    cliente = ClienteFalso(json.dumps(CANDIDATO, ensure_ascii=False))
    generador = BedrockScenarioGenerator(client=cliente)

    escenario = generador.generate(request=peticion(), scenario_id="ia-3")

    for campo in ("respuestaCorrecta", "senales", "leccion", "tipo", "permiteConversacion"):
        assert campo not in escenario.payload


def test_tolera_cercas_de_codigo_y_prosa_alrededor_del_json() -> None:
    texto = f"Claro, aquí va:\n```json\n{json.dumps(CANDIDATO, ensure_ascii=False)}\n```\n"
    generador = BedrockScenarioGenerator(client=ClienteFalso(texto))

    escenario = generador.generate(request=peticion(), scenario_id="ia-4")

    assert escenario.reveal.lesson.startswith("Nadie regala monedas")


@pytest.mark.parametrize(
    "texto",
    [
        pytest.param("", id="vacio"),
        pytest.param("no puedo ayudarte con eso", id="sin-json"),
        pytest.param("{esto no es json}", id="json-invalido"),
        pytest.param('{"tipo": "monedas-gratis"}', id="campos-faltantes"),
        pytest.param('["una", "lista"]', id="no-es-objeto"),
    ],
)
def test_una_respuesta_inutilizable_levanta_error_de_generacion(texto: str) -> None:
    generador = BedrockScenarioGenerator(client=ClienteFalso(texto))

    with pytest.raises(ScenarioGenerationError):
        generador.generate(request=peticion(), scenario_id="ia-5")


def test_rechaza_una_senal_sin_explicacion() -> None:
    roto = {**CANDIDATO, "senales": [{"fragmento": "tu contraseña"}]}
    generador = BedrockScenarioGenerator(client=ClienteFalso(json.dumps(roto)))

    with pytest.raises(ScenarioGenerationError):
        generador.generate(request=peticion(), scenario_id="ia-6")


def test_manda_el_modelo_la_temperatura_y_el_limite_de_tokens() -> None:
    cliente = ClienteFalso(json.dumps(CANDIDATO, ensure_ascii=False))
    generador = BedrockScenarioGenerator(
        client=cliente, model_id="amazon.nova-lite-v1:0", max_tokens=500, temperature=0.5
    )

    generador.generate(request=peticion(), scenario_id="ia-7")

    llamada = cliente.llamadas[0]
    assert llamada["modelId"] == "amazon.nova-lite-v1:0"
    assert llamada["inferenceConfig"] == {"maxTokens": 500, "temperature": 0.5}


def test_el_prompt_no_lleva_identidad_ni_historial() -> None:
    """ADR-005: al modelo solo van canal, banda y dificultad."""

    prompt = build_user_prompt(peticion(age_band=AgeBand.ELEVEN_TO_THIRTEEN))

    for prohibido in ("childId", "parentRef", "sub", "@", "token", "alias"):
        assert prohibido not in prompt
    assert "11 a 13" in prompt
    assert "chat-juego" in prompt


def test_el_prompt_pide_asunto_solo_en_correo() -> None:
    correo = build_user_prompt(peticion(app_type=AppType.EMAIL))
    sms = build_user_prompt(peticion(app_type=AppType.SMS))

    assert "asunto" in correo
    assert "asunto" not in sms


def test_el_prompt_legitimo_no_pide_perfil_de_estafador() -> None:
    legitimo = build_user_prompt(peticion(message_kind="legitimate"))

    assert "perfilEstafador" not in legitimo
    assert '"permiteConversacion": false' in legitimo
    assert "LEGÍTIMO" in legitimo


def test_un_error_del_cliente_se_sanitiza_como_error_de_generacion() -> None:
    generador = BedrockScenarioGenerator(client=ClienteQueFalla())

    with pytest.raises(ScenarioGenerationError) as captured:
        generador.generate(request=peticion(), scenario_id="ia-8")

    assert str(captured.value) == "SCENARIO_GENERATION_FAILED"
    assert captured.value.__cause__ is None
