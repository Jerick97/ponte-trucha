from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.conversation_reply import ConversationReply
from ponte_trucha.application.get_or_create_account import GetOrCreateAccount
from ponte_trucha.application.policy import CURRENT_PRIVACY_POLICY_VERSION
from ponte_trucha.application.update_consent import (
    ConsentDecision,
    UpdateConsent,
    UpdateConsentCommand,
)
from ponte_trucha.domain.challenge import Challenge, Grading, MessageKind
from ponte_trucha.domain.channels import AppType
from ponte_trucha.domain.errors import (
    ChallengeNotFoundError,
    ConsentRequiredError,
    ConversationNotAllowedError,
)
from ponte_trucha.domain.scenario_bank import ScammerProfile, ScenarioReveal, ScenarioSignal
from ponte_trucha.domain.value_objects import ConsentPurpose, Difficulty

from .fakes import (
    FixedClock,
    InMemoryConsentRepository,
    InMemoryParentAccountRepository,
)
from .in_memory_game_repositories import InMemoryChallengeRepository

ADULT = AuthenticatedAdult(parent_ref="parent-1", scopes=frozenset({"game.play"}))
CHILD_ID = "child-1"
CHALLENGE_ID = "challenge-1"
_NOW = datetime(2026, 7, 25, 12, 0, tzinfo=UTC)


def _challenge(*, allows_conversation: bool = True, answered: bool = True) -> Challenge:
    challenge = Challenge(
        challenge_id=CHALLENGE_ID,
        scenario_id="robux-gratis",
        scenario_version=1,
        app_type=AppType.ROBLOX,
        difficulty=Difficulty(1),
        message_kind=MessageKind.TRAP,
        payload_snapshot={"mensaje": "Te regalo 10 000 Robux"},
        grading=Grading(
            decision=MessageKind.TRAP,
            signal_codes=("tu-contrasena",),
            feedback_code="nadie-te-pide-tu-clave",
            reveal=ScenarioReveal(
                scenario_type="robo-de-cuenta",
                signals=(
                    ScenarioSignal(
                        fragment="tu contraseña",
                        explanation="Nadie de verdad te pide tu clave.",
                    ),
                ),
                lesson="Nadie que sea de verdad te pide tu clave.",
                allows_conversation=allows_conversation,
                scammer_profile=ScammerProfile(
                    disguise="el admin del juego",
                    tactics=("prisa", "premio"),
                    objective="conseguir la contraseña",
                ),
            ),
        ),
        issued_at=_NOW,
        valid_until=_NOW + timedelta(minutes=30),
    )
    if answered:
        challenge.mark_answered(answered_at=_NOW + timedelta(minutes=1))
    return challenge


def _responder(
    *,
    grant_ai: bool,
    challenge: Challenge | None = None,
) -> ConversationReply:
    accounts = InMemoryParentAccountRepository()
    consents = InMemoryConsentRepository()
    challenges = InMemoryChallengeRepository()
    clock = FixedClock()
    GetOrCreateAccount(accounts=accounts, consents=consents, clock=clock).execute(
        ADULT, age_gate_rule_version="adult-self-declaration-v1"
    )
    if grant_ai:
        UpdateConsent(accounts=accounts, consents=consents, clock=clock).execute(
            ADULT,
            UpdateConsentCommand(
                purpose=ConsentPurpose.SERVER_SIDE_AI,
                decision=ConsentDecision.GRANT,
                policy_version=CURRENT_PRIVACY_POLICY_VERSION,
                method="settings",
            ),
        )
    if challenge is not None:
        challenges.create(parent_ref=ADULT.parent_ref, child_id=CHILD_ID, challenge=challenge)
    return ConversationReply(accounts=accounts, consents=consents, challenges=challenges)


def test_conversation_requires_current_server_side_ai_consent() -> None:
    responder = _responder(grant_ai=False, challenge=_challenge())

    with pytest.raises(ConsentRequiredError):
        responder.execute(ADULT, challenge_id=CHALLENGE_ID, child_turns=("Hola",))


def test_conversation_rejects_a_challenge_that_is_not_ours() -> None:
    responder = _responder(grant_ai=True)

    with pytest.raises(ChallengeNotFoundError):
        responder.execute(ADULT, challenge_id="challenge-ajeno", child_turns=("Hola",))


def test_conversation_rejects_a_challenge_still_unanswered() -> None:
    """El chat se abre después de decidir: antes sería una pista gratis."""

    responder = _responder(grant_ai=True, challenge=_challenge(answered=False))

    with pytest.raises(ConversationNotAllowedError):
        responder.execute(ADULT, challenge_id=CHALLENGE_ID, child_turns=("Hola",))


def test_conversation_rejects_a_scenario_that_does_not_allow_it() -> None:
    responder = _responder(grant_ai=True, challenge=_challenge(allows_conversation=False))

    with pytest.raises(ConversationNotAllowedError):
        responder.execute(ADULT, challenge_id=CHALLENGE_ID, child_turns=("Hola",))


def test_first_reply_uses_the_disguise_of_the_scenario() -> None:
    responder = _responder(grant_ai=True, challenge=_challenge())

    reply = responder.execute(ADULT, challenge_id=CHALLENGE_ID, child_turns=("Quiero saber más",))

    assert reply.startswith("Oe, soy el admin del juego.")


def test_pressure_escalates_with_the_turn_without_touching_the_child() -> None:
    responder = _responder(grant_ai=True, challenge=_challenge())

    reply = responder.execute(
        ADULT,
        challenge_id=CHALLENGE_ID,
        child_turns=("dale", "cuánto es", "y luego qué"),
    )

    assert reply == "Si no me respondes ahora, se va a cancelar y no puedo hacer nada."


def test_conversation_stops_pressuring_after_child_refusal() -> None:
    responder = _responder(grant_ai=True, challenge=_challenge())

    reply = responder.execute(
        ADULT,
        challenge_id=CHALLENGE_ID,
        child_turns=("No, voy a llamar a un adulto",),
    )

    assert reply == "Ya, está bien. No tienes que hacer nada."
