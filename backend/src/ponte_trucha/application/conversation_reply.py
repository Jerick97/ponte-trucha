"""Respuesta conversacional efímera con consentimiento y fallback seguro.

Bedrock permanece deshabilitado por ADR-005: la respuesta sale de un guion
curado que se apoya en el `ScammerProfile` del escenario ya respondido.

Reglas que aplica, en este orden:

1. cuenta activa y consentimiento `serverSideAi` vigente;
2. el reto existe, pertenece a este adulto y **ya fue respondido**;
3. el escenario admite conversación (solo las trampas la admiten);
4. si el niño se niega, avisa a un adulto, bloquea o reporta, el personaje se
   rinde de inmediato y no vuelve a presionar (`seguridad-infantil.md`);
5. la presión sube de tono con los turnos, siempre sobre la estafa y nunca
   sobre la persona.

El texto que escribe el niño es efímero: se usa para elegir la respuesta y no
se persiste, ni se loguea, ni se devuelve.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.policy import CURRENT_PRIVACY_POLICY_VERSION
from ponte_trucha.application.ports import (
    ChallengeRepository,
    ConsentRepository,
    ParentAccountRepository,
)
from ponte_trucha.domain.challenge import ChallengeStatus
from ponte_trucha.domain.errors import (
    AccountNotFoundError,
    ChallengeNotFoundError,
    ConsentRequiredError,
    ConversationNotAllowedError,
)
from ponte_trucha.domain.scenario_bank import ScammerProfile
from ponte_trucha.domain.value_objects import ConsentPurpose

_REFUSAL_MARKERS = frozenset(
    {
        "no",
        "nunca",
        "adulto",
        "mamá",
        "mama",
        "papá",
        "papa",
        "bloquear",
        "bloqueo",
        "reportar",
        "reporto",
        "denunciar",
        "profesor",
        "profe",
        "chau",
    }
)
_STOP_REPLY = "Ya, está bien. No tienes que hacer nada."
_MAX_TURNS = 4

# Guion por turno. Sube la presión sin tocar a la persona: siempre habla del
# premio, del apuro o de la cuenta, nunca del niño.
_PRESSURE_LINES: tuple[str, ...] = (
    "Apúrate, el premio puede desaparecer. ¿Seguro que no quieres seguir?",
    "Solo faltas tú. Los demás ya lo hicieron y ya recibieron lo suyo.",
    "Si no me respondes ahora, se va a cancelar y no puedo hacer nada.",
    "Última oportunidad. Después no me reclames por haberte avisado.",
)


def _fallback_reply(*, turn: int) -> str:
    return _PRESSURE_LINES[min(turn, len(_PRESSURE_LINES)) - 1]


def _reply_for(profile: ScammerProfile | None, *, turn: int) -> str:
    """Primera línea con el disfraz del personaje; luego, presión creciente."""

    if profile is None or turn > 1:
        return _fallback_reply(turn=turn)
    return f"Oe, soy {profile.disguise}. {_PRESSURE_LINES[0]}"


def _is_refusal(text: str) -> bool:
    """Compara palabras completas: `no` no debe dispararse dentro de otra palabra."""

    words = {word for word in re.split(r"[^0-9a-záéíóúüñ]+", text.casefold()) if word}
    return bool(words & _REFUSAL_MARKERS)


@dataclass(frozen=True, slots=True)
class ConversationReply:
    accounts: ParentAccountRepository
    consents: ConsentRepository
    challenges: ChallengeRepository

    def execute(
        self,
        adult: AuthenticatedAdult,
        *,
        challenge_id: str,
        child_turns: tuple[str, ...],
    ) -> str:
        account = self.accounts.get(parent_ref=adult.parent_ref)
        if account is None:
            raise AccountNotFoundError()
        account.require_active()

        consent = self.consents.get(
            parent_ref=adult.parent_ref,
            purpose=ConsentPurpose.SERVER_SIDE_AI,
        )
        if consent is None or not consent.is_active_for(CURRENT_PRIVACY_POLICY_VERSION):
            raise ConsentRequiredError()

        child_id = self.challenges.locate_child(
            parent_ref=adult.parent_ref, challenge_id=challenge_id
        )
        if child_id is None:
            raise ChallengeNotFoundError()
        challenge = self.challenges.get(child_id=child_id, challenge_id=challenge_id)
        if challenge is None:
            raise ChallengeNotFoundError()

        if challenge.status is not ChallengeStatus.ANSWERED:
            raise ConversationNotAllowedError("El reto todavía no fue respondido.")
        if not challenge.allows_conversation:
            raise ConversationNotAllowedError("Este escenario no admite conversación.")

        turn = min(len(child_turns), _MAX_TURNS) or 1
        if child_turns and _is_refusal(child_turns[-1]):
            return _STOP_REPLY
        return _reply_for(challenge.grading.reveal.scammer_profile, turn=turn)
