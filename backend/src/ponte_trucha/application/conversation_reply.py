"""Respuesta conversacional efímera con consentimiento y fallback seguro.

Bedrock permanece deshabilitado por ADR-005. Este caso de uso conserva el
contrato HTTP y aplica una respuesta curada sin persistir el historial.
"""

from __future__ import annotations

from dataclasses import dataclass

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.policy import CURRENT_PRIVACY_POLICY_VERSION
from ponte_trucha.application.ports import ConsentRepository, ParentAccountRepository
from ponte_trucha.domain.errors import AccountNotFoundError, ConsentRequiredError
from ponte_trucha.domain.value_objects import ConsentPurpose

_REFUSAL_MARKERS = (
    "no",
    "adulto",
    "mamá",
    "mama",
    "papá",
    "papa",
    "bloquear",
    "reportar",
)
_STOP_REPLY = "Ya, está bien. No tienes que hacer nada."
_SAFE_REPLY = "Apúrate, el premio puede desaparecer. ¿Seguro que no quieres seguir?"


@dataclass(frozen=True, slots=True)
class ConversationReply:
    accounts: ParentAccountRepository
    consents: ConsentRepository

    def execute(
        self,
        adult: AuthenticatedAdult,
        *,
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

        last_turn = child_turns[-1].casefold() if child_turns else ""
        if any(marker in last_turn for marker in _REFUSAL_MARKERS):
            return _STOP_REPLY
        return _SAFE_REPLY
