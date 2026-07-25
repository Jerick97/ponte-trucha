"""Caso de uso: actualizar la decisión de consentimiento de una finalidad.

El adulto solo puede `grant` o `revoke` explícitamente. La transición `deny`
por cambio de política (design.md: "nueva política rechazada") ocurre fuera
de este caso de uso, cuando `GetConsents`/`GetOrCreateAccount` detectan una
versión desactualizada; no se modela aquí para no confundir una acción del
adulto con un efecto automático de la política.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.policy import CURRENT_PRIVACY_POLICY_VERSION
from ponte_trucha.application.ports import Clock, ConsentRepository, ParentAccountRepository
from ponte_trucha.domain.consent import ConsentRecord
from ponte_trucha.domain.errors import AccountNotFoundError, PolicyVersionStaleError
from ponte_trucha.domain.value_objects import ConsentPurpose


class ConsentDecision(StrEnum):
    GRANT = "grant"
    REVOKE = "revoke"


@dataclass(frozen=True, slots=True)
class UpdateConsentCommand:
    purpose: ConsentPurpose
    decision: ConsentDecision
    policy_version: str
    method: str


class UpdateConsent:
    """Aplica una decisión del adulto y persiste el nuevo estado vigente."""

    def __init__(
        self,
        *,
        accounts: ParentAccountRepository,
        consents: ConsentRepository,
        clock: Clock,
    ) -> None:
        self._accounts = accounts
        self._consents = consents
        self._clock = clock

    def execute(self, adult: AuthenticatedAdult, command: UpdateConsentCommand) -> ConsentRecord:
        account = self._accounts.get(parent_ref=adult.parent_ref)
        if account is None:
            raise AccountNotFoundError("La cuenta adulta no está provisionada.")
        account.require_active()

        if command.policy_version != CURRENT_PRIVACY_POLICY_VERSION:
            raise PolicyVersionStaleError(
                "La decisión usa una versión de política distinta a la vigente."
            )

        current = self._consents.get(parent_ref=adult.parent_ref, purpose=command.purpose)
        if current is None:
            current = ConsentRecord.initial(
                command.purpose,
                policy_version=CURRENT_PRIVACY_POLICY_VERSION,
                now=self._clock.now(),
            )

        now = self._clock.now()
        updated = (
            current.grant(policy_version=command.policy_version, method=command.method, now=now)
            if command.decision == ConsentDecision.GRANT
            else current.revoke(now=now)
        )

        self._consents.save(parent_ref=adult.parent_ref, record=updated)
        return updated
