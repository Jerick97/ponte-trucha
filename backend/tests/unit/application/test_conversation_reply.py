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
from ponte_trucha.domain.errors import ConsentRequiredError
from ponte_trucha.domain.value_objects import ConsentPurpose

from .fakes import (
    FixedClock,
    InMemoryConsentRepository,
    InMemoryParentAccountRepository,
)


def _configured_responder(*, grant_ai: bool) -> tuple[ConversationReply, AuthenticatedAdult]:
    accounts = InMemoryParentAccountRepository()
    consents = InMemoryConsentRepository()
    clock = FixedClock()
    adult = AuthenticatedAdult(parent_ref="parent-1", scopes=frozenset({"game.play"}))
    GetOrCreateAccount(accounts=accounts, consents=consents, clock=clock).execute(
        adult,
        age_gate_rule_version="adult-self-declaration-v1",
    )
    if grant_ai:
        UpdateConsent(accounts=accounts, consents=consents, clock=clock).execute(
            adult,
            UpdateConsentCommand(
                purpose=ConsentPurpose.SERVER_SIDE_AI,
                decision=ConsentDecision.GRANT,
                policy_version=CURRENT_PRIVACY_POLICY_VERSION,
                method="settings",
            ),
        )
    return ConversationReply(accounts=accounts, consents=consents), adult


def test_conversation_requires_current_server_side_ai_consent() -> None:
    responder, adult = _configured_responder(grant_ai=False)

    with pytest.raises(ConsentRequiredError):
        responder.execute(adult, child_turns=("Hola",))


def test_conversation_returns_only_a_curated_safe_reply() -> None:
    responder, adult = _configured_responder(grant_ai=True)

    reply = responder.execute(adult, child_turns=("Quiero saber más",))

    assert reply == "Apúrate, el premio puede desaparecer. ¿Seguro que no quieres seguir?"


def test_conversation_stops_pressuring_after_child_refusal() -> None:
    responder, adult = _configured_responder(grant_ai=True)

    reply = responder.execute(adult, child_turns=("No, voy a llamar a un adulto",))

    assert reply == "Ya, está bien. No tienes que hacer nada."
