from __future__ import annotations

import hashlib
from dataclasses import dataclass

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.idempotency import IdempotencyStore, execute_idempotently
from ponte_trucha.application.ports import (
    AttemptRepository,
    ChallengeRepository,
    ChildProfileRepository,
    Clock,
    ConsentRepository,
    ParentAccountRepository,
    ProgressRepository,
)


@dataclass(frozen=True, slots=True)
class DeleteAdultAccount:
    accounts: ParentAccountRepository
    consents: ConsentRepository
    profiles: ChildProfileRepository
    challenges: ChallengeRepository
    attempts: AttemptRepository
    progresses: ProgressRepository
    idempotency: IdempotencyStore
    clock: Clock

    def execute(self, adult: AuthenticatedAdult, *, idempotency_key: str) -> tuple[bool, bool]:
        snapshot, replayed = execute_idempotently(
            self.idempotency,
            parent_ref=adult.parent_ref,
            scope_key="ACCOUNT",
            operation="DeleteAdultAccount",
            idempotency_key=idempotency_key,
            request_hash=hashlib.sha256(b"delete-account").hexdigest(),
            now=self.clock.now(),
            run=lambda: {"deleted": self._delete(adult)},
        )
        return bool(snapshot["deleted"]), replayed

    def _delete(self, adult: AuthenticatedAdult) -> bool:
        account = self.accounts.get(parent_ref=adult.parent_ref)
        if account is None:
            return True

        for profile in self.profiles.list_for_parent(parent_ref=adult.parent_ref):
            self.challenges.delete_for_child(parent_ref=adult.parent_ref, child_id=profile.child_id)
            self.attempts.delete_for_child(child_id=profile.child_id)
            self.progresses.delete(child_id=profile.child_id)

        self.profiles.delete_for_parent(parent_ref=adult.parent_ref)
        self.consents.delete_for_parent(parent_ref=adult.parent_ref)
        self.accounts.delete(parent_ref=adult.parent_ref)
        return True
