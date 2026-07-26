"""Generador de escenarios con Amazon Bedrock (API Converse).

## Privacidad (ADR-005)

El prompt lleva **solo** canal, banda etaria, dificultad y veredicto pedido.
Nunca `parentRef`, `childId`, correo, alias, ni texto que haya escrito un niño.
Tampoco historial: cada generación es independiente. Bedrock debe operar con
retención cero, es decir sin *model invocation logging* configurado en la
cuenta; eso se verifica fuera de este código con
`aws bedrock get-model-invocation-logging-configuration`.

## Qué devuelve

Un candidato, no contenido publicable. La salida del modelo se parsea al mismo
formato del banco curado (`scenario_from_raw`) y después la revisan los
guardrails (`domain/guardrails.py`). Si el modelo devuelve algo que no es JSON
utilizable, se levanta `ScenarioGenerationError` y quien llame usa el banco
curado.

El texto crudo del modelo nunca se loguea ni se propaga en el mensaje del
error: solo el código.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, Protocol, cast

from ponte_trucha.adapters.curated_scenario_bank import scenario_from_raw
from ponte_trucha.domain.channels import AppType
from ponte_trucha.domain.errors import ScenarioGenerationError
from ponte_trucha.domain.guardrails import (
    ALLOWED_SCENARIO_TYPES,
    LEGITIMATE_SCENARIO_TYPE,
    MAX_LESSON_LENGTH,
    MAX_MESSAGE_LENGTH,
    MAX_SIGNALS,
    ScenarioRequest,
)
from ponte_trucha.domain.scenario_bank import CuratedScenario

DEFAULT_MODEL_ID = "amazon.nova-lite-v1:0"
DEFAULT_MAX_TOKENS = 900
DEFAULT_TEMPERATURE = 0.9

# Canal del banco de contenido para cada `AppType`. Es el inverso del mapa de
# `curated_scenario_bank`: el modelo escribe en el vocabulario del banco.
_APP_TYPE_TO_CHANNEL: dict[AppType, str] = {
    AppType.WHATSAPP: "whatsapp",
    AppType.SMS: "sms",
    AppType.EMAIL: "correo",
    AppType.ROBLOX: "chat-juego",
    AppType.DISCORD: "discord",
}

_CHANNEL_DESCRIPTIONS: dict[str, str] = {
    "whatsapp": "un chat de WhatsApp desde un número desconocido",
    "sms": "un SMS de un número corto",
    "correo": "un correo electrónico (necesita el campo asunto)",
    "chat-juego": "el chat de un juego tipo Roblox",
    "discord": "un mensaje directo de Discord",
}

_AGE_BAND_HINTS: dict[str, str] = {
    "8-10": "8 a 10 años: frases muy simples, la trampa se nota si te fijas",
    "11-13": "11 a 13 años: la trampa es más elaborada y menos obvia",
}

SYSTEM_PROMPT = """\
Escribes contenido para Ponte Trucha Kids, un juego donde niños de 8 a 13 años \
aprenden a detectar estafas digitales. Devuelves UN escenario en JSON y nada más.

Voz del juego:
- español latino neutro con sabor peruano suave; tuteo directo.
- frases cortas, sin jerga técnica.
- enseñar jugando, nunca asustando.

En "leccion" y en las "explicacion" de cada señal habla el juego, así que ahí \
está PROHIBIDO usar: phishing, malware, hackeo, ciberdelincuente, \
vulnerabilidad, ingeniería social, peligro. En "mensaje" habla el personaje, que \
sí puede sonar urgente o usar excusas técnicas.

Ámbito permitido: monedas o premios gratis, sorteos falsos, robo de cuenta, \
archivos o links tramposos, suplantación de un amigo, y mensajes legítimos y \
seguros. PROHIBIDO cualquier otro tema: nada sexual, ni acoso, ni citas o \
encuentros en persona, ni violencia, ni armas, ni drogas, ni alcohol, ni \
autolesión, ni amenazas físicas, ni pedir la dirección de la casa. No inventes \
teléfonos ni links reales: enmascara los números.

Responde SOLO con el objeto JSON, sin explicaciones y sin bloques de código.\
"""


class ConverseClient(Protocol):
    """Mínimo de `bedrock-runtime` que usa este adapter."""

    def converse(
        self,
        *,
        modelId: str,  # noqa: N803 - nombre de la API de AWS
        system: list[dict[str, Any]],
        messages: list[dict[str, Any]],
        inferenceConfig: dict[str, Any],  # noqa: N803 - nombre de la API de AWS
    ) -> dict[str, Any]: ...


def build_user_prompt(request: ScenarioRequest) -> str:
    """Instrucción concreta del candidato pedido. No contiene identidad alguna."""

    channel = _APP_TYPE_TO_CHANNEL[request.app_type]
    is_trap = request.message_kind == "trap"
    scenario_types = sorted(ALLOWED_SCENARIO_TYPES - {LEGITIMATE_SCENARIO_TYPE})

    lines = [
        f"Canal: {channel} ({_CHANNEL_DESCRIPTIONS[channel]}).",
        f"Dificultad: {request.difficulty.value} de 3.",
        f"Público: {_AGE_BAND_HINTS[request.age_band.value]}.",
        (
            "El mensaje ES una trampa."
            if is_trap
            else "El mensaje es LEGÍTIMO y seguro: no pide nada del niño."
        ),
        "",
        "Devuelve este JSON exacto:",
        "{",
        (
            f'  "tipo": uno de {scenario_types},'
            if is_trap
            else f'  "tipo": "{LEGITIMATE_SCENARIO_TYPE}",'
        ),
        f'  "canal": "{channel}",',
        f'  "dificultad": {request.difficulty.value},',
        '  "remitente": {"nombre": "máx 40 caracteres", "avatar": "un emoji",'
        ' "verificado": true o false},',
        f'  "mensaje": "lo que llega, máximo {MAX_MESSAGE_LENGTH} caracteres",',
        *(['  "asunto": "asunto del correo, máx 80 caracteres",'] if channel == "correo" else []),
        f'  "respuestaCorrecta": "{"trampa" if is_trap else "confianza"}",',
        f'  "senales": [1 a {MAX_SIGNALS} objetos'
        ' {"fragmento": "texto copiado LITERAL del mensaje",'
        ' "explicacion": "por qué importa, 10 a 160 caracteres"}],',
        f'  "leccion": "una frase de máximo {MAX_LESSON_LENGTH} caracteres"',
    ]

    if is_trap:
        lines.extend(
            [
                '  , "permiteConversacion": true,',
                '  "perfilEstafador": {"disfraz": "cómo se presenta",'
                ' "tacticas": ["prisa", "premio"], "objetivo": "qué quiere conseguir"}',
            ]
        )
    else:
        lines.append('  , "permiteConversacion": false')

    lines.extend(
        [
            "}",
            "",
            "Cada `fragmento` debe aparecer copiado tal cual dentro de `mensaje`"
            + (" o de `asunto`." if channel == "correo" else "."),
        ]
    )
    return "\n".join(lines)


def _text_from_response(response: dict[str, Any]) -> str:
    output = response.get("output")
    if not isinstance(output, dict):
        raise ScenarioGenerationError("Respuesta sin `output`.")
    message = cast("dict[str, Any]", output).get("message")
    if not isinstance(message, dict):
        raise ScenarioGenerationError("Respuesta sin `message`.")
    blocks = cast("dict[str, Any]", message).get("content")
    if not isinstance(blocks, list):
        raise ScenarioGenerationError("Respuesta sin bloques de contenido.")

    texts: list[str] = []
    for block in cast("list[Any]", blocks):
        if not isinstance(block, dict):
            continue
        text = cast("dict[str, Any]", block).get("text")
        if isinstance(text, str):
            texts.append(text)
    if not texts:
        raise ScenarioGenerationError("Respuesta sin texto.")
    return "\n".join(texts)


def _json_object_from(text: str) -> dict[str, Any]:
    """Extrae el objeto JSON aunque venga con prosa o cercas de código.

    Se busca desde la primera `{` hasta la última `}` en vez de exigir un JSON
    perfecto: los modelos añaden ```json o una frase de cortesía, y descartar el
    candidato por eso sería tirar contenido bueno.
    """

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end <= start:
        raise ScenarioGenerationError("La respuesta no contiene un objeto JSON.")
    try:
        parsed: object = json.loads(text[start : end + 1])
    except json.JSONDecodeError as error:
        raise ScenarioGenerationError("El JSON de la respuesta no es válido.") from error
    if not isinstance(parsed, dict):
        raise ScenarioGenerationError("La respuesta no es un objeto JSON.")
    return {str(key): value for key, value in cast("dict[Any, Any]", parsed).items()}


_REQUIRED_KEYS = (
    "tipo",
    "canal",
    "dificultad",
    "remitente",
    "mensaje",
    "respuestaCorrecta",
    "senales",
    "leccion",
    "permiteConversacion",
)


def _require_shape(raw: dict[str, Any]) -> None:
    missing = [key for key in _REQUIRED_KEYS if key not in raw]
    if missing:
        raise ScenarioGenerationError(f"Faltan campos: {', '.join(missing)}.")
    if not isinstance(raw["senales"], list) or not raw["senales"]:
        raise ScenarioGenerationError("`senales` debe ser una lista con al menos un elemento.")
    for signal in cast("list[Any]", raw["senales"]):
        if not isinstance(signal, dict) or "fragmento" not in signal or "explicacion" not in signal:
            raise ScenarioGenerationError("Una señal no tiene fragmento y explicación.")
    if not isinstance(raw["remitente"], dict):
        raise ScenarioGenerationError("`remitente` debe ser un objeto.")


@dataclass(frozen=True, slots=True)
class BedrockScenarioGenerator:
    """Implementa `ScenarioGenerator` sobre la API Converse de Bedrock."""

    client: ConverseClient
    model_id: str = DEFAULT_MODEL_ID
    max_tokens: int = DEFAULT_MAX_TOKENS
    temperature: float = DEFAULT_TEMPERATURE
    system_prompt: str = field(default=SYSTEM_PROMPT)

    def generate(self, *, request: ScenarioRequest, scenario_id: str) -> CuratedScenario:
        try:
            response = self.client.converse(
                modelId=self.model_id,
                system=[{"text": self.system_prompt}],
                messages=[{"role": "user", "content": [{"text": build_user_prompt(request)}]}],
                inferenceConfig={"maxTokens": self.max_tokens, "temperature": self.temperature},
            )
        except Exception:
            # El SDK puede incluir partes del request en el error. El límite del
            # adapter las reemplaza por un código estable antes del fallback.
            raise ScenarioGenerationError() from None

        raw = _json_object_from(_text_from_response(response))
        _require_shape(raw)
        # El id lo decide quien pide, no el modelo: así no puede colisionar con
        # el banco curado ni filtrar nada en el identificador.
        raw["id"] = scenario_id
        scenario = scenario_from_raw(raw)
        if scenario is None:
            raise ScenarioGenerationError("El canal devuelto no está aprobado.")
        return scenario
