"""Caso de uso: obtener la cuenta adulta, provisionándola en el primer acceso.

Cubre R1/R2 de `autenticacion-consentimiento-parental`: tras superar el age
gate y verificar la cuenta en Cognito, el backend nunca recibe la fecha de
nacimiento. Solo persiste la versión de la regla vigente y el timestamp de
aprobación, calculados por el frontend y reenviados como `ageGateRuleVersion`.

El bootstrap es idempotente: una segunda llamada con la misma cuenta no
duplica el `ParentAccount` ni reinicia sus consentimientos.
"""

from __future__ import annotations

from dataclasses import dataclass

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.policy import CURRENT_PRIVACY_POLICY_VERSION
from ponte_trucha.application.ports import Clock, ConsentRepository, ParentAccountRepository
from ponte_trucha.domain.consent import ConsentRecord
from ponte_trucha.domain.parent_account import ParentAccount
from ponte_trucha.domain.value_objects import ConsentPurpose


@dataclass(frozen=True, slots=True)
class GetOrCreateAccountResult:
    account: ParentAccount
    created: bool


class GetOrCreateAccount:
    """Devuelve la cuenta adulta, creándola con consentimientos por defecto."""

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

    def execute(
        self, adult: AuthenticatedAdult, *, age_gate_rule_version: str
    ) -> GetOrCreateAccountResult:
        existing = self._accounts.get(parent_ref=adult.parent_ref)
        if existing is not None:
            return GetOrCreateAccountResult(account=existing, created=False)

        now = self._clock.now()
        account = ParentAccount.create(
            parent_ref=adult.parent_ref,
            age_gate_rule_version=age_gate_rule_version,
            now=now,
        )
        self._accounts.create(account)

        for purpose in ConsentPurpose:
            self._consents.save(
                parent_ref=adult.parent_ref,
                record=ConsentRecord.initial(
                    purpose, policy_version=CURRENT_PRIVACY_POLICY_VERSION, now=now
                ),
            )

        return GetOrCreateAccountResult(account=account, created=True)
