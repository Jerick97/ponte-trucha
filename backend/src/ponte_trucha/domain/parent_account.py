"""Entidad de cuenta adulta. Nunca contiene fecha de nacimiento ni email."""

from __future__ import annotations

from dataclasses import dataclass, replace

from ponte_trucha.domain.errors import AccountNotActiveError
from ponte_trucha.domain.value_objects import AccountStatus


@dataclass(frozen=True, slots=True)
class ParentAccount:
    """Estado mínimo de la cuenta adulta y constancia del age gate."""

    parent_ref: str
    age_gate_rule_version: str
    age_gate_passed_at: str
    profile_count: int
    created_at: str
    updated_at: str
    revision: int
    status: AccountStatus = AccountStatus.ACTIVE

    @classmethod
    def create(
        cls,
        *,
        parent_ref: str,
        age_gate_rule_version: str,
        now: str,
    ) -> ParentAccount:
        return cls(
            parent_ref=parent_ref,
            age_gate_rule_version=age_gate_rule_version,
            age_gate_passed_at=now,
            profile_count=0,
            created_at=now,
            updated_at=now,
            revision=0,
        )

    def require_active(self) -> None:
        if self.status != AccountStatus.ACTIVE:
            raise AccountNotActiveError("La cuenta está en proceso de borrado.")

    def with_profile_count(self, *, delta: int, now: str) -> ParentAccount:
        self.require_active()
        return replace(
            self,
            profile_count=self.profile_count + delta,
            updated_at=now,
            revision=self.revision + 1,
        )

    def start_deletion(self, *, now: str) -> ParentAccount:
        self.require_active()
        return replace(
            self,
            status=AccountStatus.DELETING,
            updated_at=now,
            revision=self.revision + 1,
        )
