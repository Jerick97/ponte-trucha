"""Guardrails de contenido: la última barrera antes de que un niño lea algo.

Cadena de responsabilidad (patrón aprobado en `arquitectura.md`): reglas
pequeñas, ordenadas y testeables. La primera que rechaza corta la cadena y
devuelve un `code` estable, apto para métricas de baja cardinalidad y para
decidir el fallback curado sin exponer el texto rechazado.

Qué garantiza, en orden:

1. el candidato es del canal, dificultad y tipo que se pidieron;
2. respeta el contrato de contenido del banco (`src/data/escenarios.schema.json`
   y `scripts/validar-escenarios.mjs`): largos, señales literales, coherencia
   entre tipo y respuesta correcta, asunto solo en correo;
3. no usa el vocabulario que `tono-infantil.md` prohíbe;
4. no sale del ámbito del producto: estafas y fraude digital. Nunca acoso,
   contenido sexual, violencia, drogas, autolesión ni encuentros en persona
   (`seguridad-infantil.md`).

Esto es un piso, no un sustituto de revisión humana: por eso lo generado nace
como borrador y publicarlo es un paso explícito.

Sin dependencias externas: dominio puro.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from typing import Any, Protocol, cast

from ponte_trucha.domain.channels import AppType
from ponte_trucha.domain.scenario_bank import CuratedScenario
from ponte_trucha.domain.value_objects import AgeBand, Difficulty

MAX_MESSAGE_LENGTH = 240
MIN_MESSAGE_LENGTH = 10
MAX_SUBJECT_LENGTH = 80
MIN_SUBJECT_LENGTH = 3
MAX_LESSON_LENGTH = 120
MIN_LESSON_LENGTH = 10
MAX_SENDER_NAME_LENGTH = 40
MAX_EXPLANATION_LENGTH = 160
MIN_EXPLANATION_LENGTH = 10
MIN_SIGNALS = 1
MAX_SIGNALS = 3

LEGITIMATE_SCENARIO_TYPE = "legitimo"

# Mismo catálogo cerrado que `escenarios.schema.json`. Ampliarlo es una decisión
# de contenido, no algo que la IA pueda inventar.
ALLOWED_SCENARIO_TYPES: frozenset[str] = frozenset(
    {
        "monedas-gratis",
        "sorteo-falso",
        "robo-de-cuenta",
        "hack-con-virus",
        "link-tramposo",
        "suplantacion-de-amigo",
        LEGITIMATE_SCENARIO_TYPE,
    }
)

# Palabras que `tono-infantil.md` prohíbe: jerga técnica o lenguaje que asusta.
# Se comparan sin acentos y como subcadena, para atrapar las variantes
# ("hackeo", "hackear", "hackeado").
FORBIDDEN_VOCABULARY: tuple[str, ...] = (
    "phishing",
    "malware",
    "ransomware",
    "troyano",
    "keylogger",
    "hacke",
    "hacker",
    "ciberdelinc",
    "cibercrim",
    "vulnerabilidad",
    "ingenieria social",
    "peligro",
)

# Temas fuera del ámbito editorial. Cualquier coincidencia descarta el
# candidato completo: no se "corrige", se tira.
#
# Se comparan con límite de palabra (`\b`) a propósito. Buscar "arma" como
# subcadena rechazaba "armamos partida", que es un mensaje legítimo del banco:
# un guardrail que muerde contenido bueno termina apagado, y apagado no protege
# a nadie.
OUT_OF_SCOPE_PATTERNS: tuple[str, ...] = (
    # sexual y acoso
    r"sin ropa",
    r"desnud\w*",
    r"sexual\w*",
    r"sexo",
    r"porno\w*",
    r"acos(?:o|ar|arte|an)\b",
    r"grooming",
    r"bes(?:ar|arte|ame|o)\b",
    # encuentros y localización
    r"en persona",
    r"nos vemos",
    r"direccion de tu casa",
    r"donde vives",
    # violencia y amenazas
    r"secuestr\w*",
    r"matar\w*",
    r"golpear\w*",
    r"pegarte",
    r"lastimarte",
    r"amenaz\w*",
    r"armas?\b",
    r"pistola\w*",
    r"cuchillo\w*",
    # sustancias
    r"drogas?\b",
    r"marihuana",
    r"cocain\w*",
    r"alcohol\w*",
    # autolesión
    r"suicid\w*",
    r"autolesion\w*",
    r"cortarte",
)

_OUT_OF_SCOPE = re.compile(r"\b(?:" + "|".join(OUT_OF_SCOPE_PATTERNS) + r")")
_LONG_NUMBER = re.compile(r"\d{7,}")


@dataclass(frozen=True, slots=True)
class ScenarioRequest:
    """Lo que se le pidió al generador. El candidato debe respetarlo."""

    app_type: AppType
    difficulty: Difficulty
    age_band: AgeBand
    message_kind: str
    """`"trap"` o `"legitimate"`, igual que `CuratedScenario.message_kind`."""


@dataclass(frozen=True, slots=True)
class GuardrailRejection:
    """Motivo del rechazo. `code` va a métricas; `detail` solo a diagnóstico."""

    code: str
    detail: str

    def __str__(self) -> str:
        return f"{self.code}: {self.detail}"


class GuardrailRule(Protocol):
    """Una regla de la cadena. Devuelve `None` si el candidato le parece bien."""

    def check(
        self, scenario: CuratedScenario, request: ScenarioRequest
    ) -> GuardrailRejection | None: ...


def _normalize(text: str) -> str:
    """Minúsculas y sin acentos, para comparar vocabulario de forma estable."""

    lowered = text.casefold()
    decomposed = unicodedata.normalize("NFD", lowered)
    return "".join(char for char in decomposed if not unicodedata.combining(char))


def _message(scenario: CuratedScenario) -> str:
    return str(scenario.payload.get("mensaje", ""))


def _subject(scenario: CuratedScenario) -> str | None:
    raw = scenario.payload.get("asunto")
    return None if raw is None else str(raw)


def _sender_name(scenario: CuratedScenario) -> str:
    sender: Any = scenario.payload.get("remitente")
    if not isinstance(sender, dict):
        return ""
    name = cast("dict[str, Any]", sender).get("nombre")
    return name if isinstance(name, str) else ""


def _scam_texts(scenario: CuratedScenario) -> tuple[str, ...]:
    """Texto que dice el personaje: el mensaje, su asunto y su nombre.

    Aquí el vocabulario técnico está permitido, porque así hablan las estafas
    de verdad ("detectamos un hackeo en tu cuenta"). El banco curado ya usa esa
    voz. Lo que no cambia es el ámbito: una estafa puede sonar urgente, nunca
    puede tocar los temas prohibidos.
    """

    subject = _subject(scenario)
    return (
        _message(scenario),
        _sender_name(scenario),
        *(() if subject is None else (subject,)),
    )


def _narration_texts(scenario: CuratedScenario) -> tuple[str, ...]:
    """Texto en el que habla el juego: lección, explicaciones y perfil.

    Esta es nuestra voz, así que aquí sí manda `tono-infantil.md`: sin jerga y
    sin asustar.
    """

    reveal = scenario.reveal
    profile = reveal.scammer_profile
    return (
        reveal.lesson,
        *(signal.explanation for signal in reveal.signals),
        *(() if profile is None else (profile.disguise, profile.objective, *profile.tactics)),
    )


@dataclass(frozen=True, slots=True)
class MatchesRequestRule:
    """El generador no elige por su cuenta el canal, el nivel ni el veredicto."""

    def check(
        self, scenario: CuratedScenario, request: ScenarioRequest
    ) -> GuardrailRejection | None:
        if scenario.app_type is not request.app_type:
            return GuardrailRejection("request_mismatch", "canal distinto al pedido")
        if scenario.difficulty != request.difficulty:
            return GuardrailRejection("request_mismatch", "dificultad distinta a la pedida")
        if scenario.message_kind != request.message_kind:
            return GuardrailRejection("request_mismatch", "tipo de mensaje distinto al pedido")
        return None


@dataclass(frozen=True, slots=True)
class TextLimitsRule:
    """Mismos límites que el esquema del banco: tiene que caber en pantalla."""

    def check(
        self, scenario: CuratedScenario, request: ScenarioRequest
    ) -> GuardrailRejection | None:
        del request
        message = _message(scenario)
        if not MIN_MESSAGE_LENGTH <= len(message) <= MAX_MESSAGE_LENGTH:
            return GuardrailRejection("text_limits", "largo del mensaje fuera de rango")

        sender_name = _sender_name(scenario)
        if not 1 <= len(sender_name) <= MAX_SENDER_NAME_LENGTH:
            return GuardrailRejection("text_limits", "nombre del remitente fuera de rango")

        subject = _subject(scenario)
        if subject is not None and not MIN_SUBJECT_LENGTH <= len(subject) <= MAX_SUBJECT_LENGTH:
            return GuardrailRejection("text_limits", "largo del asunto fuera de rango")

        lesson = scenario.reveal.lesson
        if not MIN_LESSON_LENGTH <= len(lesson) <= MAX_LESSON_LENGTH:
            return GuardrailRejection("text_limits", "largo de la lección fuera de rango")

        signals = scenario.reveal.signals
        if not MIN_SIGNALS <= len(signals) <= MAX_SIGNALS:
            return GuardrailRejection("text_limits", "cantidad de señales fuera de rango")

        for signal in signals:
            if len(signal.fragment) < 2:
                return GuardrailRejection("text_limits", "fragmento demasiado corto")
            if not (MIN_EXPLANATION_LENGTH <= len(signal.explanation) <= MAX_EXPLANATION_LENGTH):
                return GuardrailRejection("text_limits", "largo de la explicación fuera de rango")
        return None


@dataclass(frozen=True, slots=True)
class LiteralSignalsRule:
    """La UI resalta el fragmento dentro de la burbuja: debe existir tal cual."""

    def check(
        self, scenario: CuratedScenario, request: ScenarioRequest
    ) -> GuardrailRejection | None:
        del request
        subject = _subject(scenario) or ""
        visible = f"{_message(scenario)}\n{subject}"
        for signal in scenario.reveal.signals:
            if signal.fragment not in visible:
                return GuardrailRejection(
                    "signals_not_literal", "un fragmento no aparece literal en el mensaje"
                )
        return None


@dataclass(frozen=True, slots=True)
class KnownScenarioTypeRule:
    """El tipo sale de un catálogo cerrado; la IA no inventa categorías."""

    def check(
        self, scenario: CuratedScenario, request: ScenarioRequest
    ) -> GuardrailRejection | None:
        del request
        if scenario.reveal.scenario_type not in ALLOWED_SCENARIO_TYPES:
            return GuardrailRejection("unknown_scenario_type", "tipo fuera del catálogo")
        return None


@dataclass(frozen=True, slots=True)
class VerdictConsistencyRule:
    """`legitimo` si y solo si la respuesta correcta es confiar."""

    def check(
        self, scenario: CuratedScenario, request: ScenarioRequest
    ) -> GuardrailRejection | None:
        del request
        is_legitimate_type = scenario.reveal.scenario_type == LEGITIMATE_SCENARIO_TYPE
        is_legitimate_kind = scenario.message_kind == "legitimate"
        if is_legitimate_type != is_legitimate_kind:
            return GuardrailRejection(
                "verdict_inconsistent", "el tipo no coincide con la respuesta correcta"
            )
        if is_legitimate_kind and scenario.reveal.allows_conversation:
            return GuardrailRejection(
                "verdict_inconsistent", "un mensaje legítimo no abre conversación"
            )
        return None


@dataclass(frozen=True, slots=True)
class ConversationProfileRule:
    """Sin perfil del personaje no hay conversación posible ni segura."""

    def check(
        self, scenario: CuratedScenario, request: ScenarioRequest
    ) -> GuardrailRejection | None:
        del request
        reveal = scenario.reveal
        if reveal.allows_conversation and reveal.scammer_profile is None:
            return GuardrailRejection(
                "conversation_without_profile", "permite conversación sin perfil del personaje"
            )
        if not reveal.allows_conversation and reveal.scammer_profile is not None:
            return GuardrailRejection(
                "conversation_without_profile", "trae perfil pero no permite conversación"
            )
        return None


@dataclass(frozen=True, slots=True)
class ChannelFieldsRule:
    """`asunto` es exclusivo del correo, como exige el validador del banco."""

    def check(
        self, scenario: CuratedScenario, request: ScenarioRequest
    ) -> GuardrailRejection | None:
        del request
        subject = _subject(scenario)
        if scenario.app_type is AppType.EMAIL and subject is None:
            return GuardrailRejection("channel_fields", "el correo necesita asunto")
        if scenario.app_type is not AppType.EMAIL and subject is not None:
            return GuardrailRejection("channel_fields", "solo el correo lleva asunto")
        return None


@dataclass(frozen=True, slots=True)
class ForbiddenVocabularyRule:
    """Nada de jerga técnica ni lenguaje que asuste, en la voz del juego."""

    def check(
        self, scenario: CuratedScenario, request: ScenarioRequest
    ) -> GuardrailRejection | None:
        del request
        for text in _narration_texts(scenario):
            normalized = _normalize(text)
            for word in FORBIDDEN_VOCABULARY:
                if word in normalized:
                    return GuardrailRejection(
                        "forbidden_vocabulary", "usa una palabra que el tono prohíbe"
                    )
        return None


@dataclass(frozen=True, slots=True)
class ScopeRule:
    """El juego trata estafas. Todo lo demás se descarta sin negociar."""

    def check(
        self, scenario: CuratedScenario, request: ScenarioRequest
    ) -> GuardrailRejection | None:
        del request
        for text in (*_scam_texts(scenario), *_narration_texts(scenario)):
            normalized = _normalize(text)
            if _OUT_OF_SCOPE.search(normalized):
                return GuardrailRejection("out_of_scope", "toca un tema fuera del ámbito")
            # Un número largo puede ser un teléfono real; el banco los enmascara.
            if _LONG_NUMBER.search(normalized):
                return GuardrailRejection("out_of_scope", "incluye un número que parece real")
        return None


DEFAULT_RULES: tuple[GuardrailRule, ...] = (
    MatchesRequestRule(),
    TextLimitsRule(),
    LiteralSignalsRule(),
    KnownScenarioTypeRule(),
    VerdictConsistencyRule(),
    ConversationProfileRule(),
    ChannelFieldsRule(),
    ForbiddenVocabularyRule(),
    ScopeRule(),
)


@dataclass(frozen=True, slots=True)
class GuardrailChain:
    """Ejecuta las reglas en orden y corta en el primer rechazo."""

    rules: tuple[GuardrailRule, ...]

    @classmethod
    def with_default_rules(cls) -> GuardrailChain:
        return cls(rules=DEFAULT_RULES)

    def evaluate(
        self, scenario: CuratedScenario, request: ScenarioRequest
    ) -> GuardrailRejection | None:
        for rule in self.rules:
            rejection = rule.check(scenario, request)
            if rejection is not None:
                return rejection
        return None
