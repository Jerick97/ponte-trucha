from __future__ import annotations

from dataclasses import dataclass

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.ports import ParentAccountRepository
from ponte_trucha.domain.errors import AccountNotFoundError
from ponte_trucha.domain.parent_account import ParentAccount


@dataclass(frozen=True, slots=True)
class GetAccount:
    accounts: ParentAccountRepository

    def execute(self, adult: AuthenticatedAdult) -> ParentAccount:
        account = self.accounts.get(parent_ref=adult.parent_ref)
        if account is None:
            raise AccountNotFoundError()
        account.require_active()
        return account
