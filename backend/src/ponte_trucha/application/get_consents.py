"""Caso de uso: listar las decisiones de consentimiento vigentes del adulto."""

from __future__ import annotations

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.ports import ConsentRepository, ParentAccountRepository
from ponte_trucha.domain.consent import ConsentRecord
from ponte_trucha.domain.errors import AccountNotFoundError


class GetConsents:
    """Lee todas las finalidades conocidas para la cuenta del adulto."""

    def __init__(self, *, accounts: ParentAccountRepository, consents: ConsentRepository) -> None:
        self._accounts = accounts
        self._consents = consents

    def execute(self, adult: AuthenticatedAdult) -> tuple[ConsentRecord, ...]:
        account = self._accounts.get(parent_ref=adult.parent_ref)
        if account is None:
            raise AccountNotFoundError("La cuenta adulta no está provisionada.")

        return self._consents.list_for_parent(parent_ref=adult.parent_ref)
