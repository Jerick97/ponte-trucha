from __future__ import annotations

import hashlib
from dataclasses import dataclass

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.delete_child_profile import DeleteChildProfile
from ponte_trucha.application.idempotency import IdempotencyStore, execute_idempotently
from ponte_trucha.application.ports import (
    AttemptRepository,
    ChallengeRepository,
    Clock,
    ProgressRepository,
)


@dataclass(frozen=True, slots=True)
class DeleteChildProfileData:
    delete_profile: DeleteChildProfile
    challenges: ChallengeRepository
    attempts: AttemptRepository
    progresses: ProgressRepository
    idempotency: IdempotencyStore
    clock: Clock

    def execute(
        self, adult: AuthenticatedAdult, *, child_id: str, idempotency_key: str
    ) -> tuple[bool, bool]:
        snapshot, replayed = execute_idempotently(
            self.idempotency,
            parent_ref=adult.parent_ref,
            scope_key=f"CHILD#{child_id}",
            operation="DeleteChildProfile",
            idempotency_key=idempotency_key,
            request_hash=hashlib.sha256(f"delete|{child_id}".encode()).hexdigest(),
            now=self.clock.now(),
            run=lambda: {"deleted": self._delete(adult=adult, child_id=child_id)},
        )
        return bool(snapshot["deleted"]), replayed

    def _delete(self, *, adult: AuthenticatedAdult, child_id: str) -> bool:
        self.delete_profile.execute(adult, child_id=child_id)
        self.challenges.delete_for_child(parent_ref=adult.parent_ref, child_id=child_id)
        self.attempts.delete_for_child(child_id=child_id)
        self.progresses.delete(child_id=child_id)
        return True
