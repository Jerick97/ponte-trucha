from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping
from dataclasses import dataclass

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.idempotency import IdempotencyStore, execute_idempotently
from ponte_trucha.application.ports import Clock
from ponte_trucha.application.update_consent import UpdateConsent, UpdateConsentCommand
from ponte_trucha.domain.consent import ConsentRecord
from ponte_trucha.domain.value_objects import ConsentPurpose, ConsentState


def _snapshot(record: ConsentRecord) -> dict[str, object]:
    return {
        "purpose": record.purpose.value,
        "state": record.state.value,
        "policyVersion": record.policy_version,
        "method": record.method,
        "decidedAt": record.decided_at,
        "revokedAt": record.revoked_at,
        "revision": record.revision,
    }


def _from_snapshot(snapshot: Mapping[str, object]) -> ConsentRecord:
    revoked_at = snapshot.get("revokedAt")
    return ConsentRecord(
        purpose=ConsentPurpose(str(snapshot["purpose"])),
        state=ConsentState(str(snapshot["state"])),
        policy_version=str(snapshot["policyVersion"]),
        method=str(snapshot["method"]),
        decided_at=str(snapshot["decidedAt"]),
        revoked_at=str(revoked_at) if revoked_at is not None else None,
        revision=int(snapshot["revision"]),  # type: ignore[arg-type]
    )


@dataclass(frozen=True, slots=True)
class UpdateConsentIdempotently:
    update_consent: UpdateConsent
    idempotency: IdempotencyStore
    clock: Clock

    def execute(
        self,
        adult: AuthenticatedAdult,
        command: UpdateConsentCommand,
        *,
        idempotency_key: str,
    ) -> tuple[ConsentRecord, bool]:
        request_body = {
            "purpose": command.purpose.value,
            "decision": command.decision.value,
            "policyVersion": command.policy_version,
            "method": command.method,
        }
        request_hash = hashlib.sha256(
            json.dumps(request_body, sort_keys=True, separators=(",", ":")).encode()
        ).hexdigest()
        snapshot, replayed = execute_idempotently(
            self.idempotency,
            parent_ref=adult.parent_ref,
            scope_key="ACCOUNT",
            operation=f"UpdateConsent#{command.purpose.value}",
            idempotency_key=idempotency_key,
            request_hash=request_hash,
            now=self.clock.now(),
            run=lambda: _snapshot(self.update_consent.execute(adult, command)),
        )
        return _from_snapshot(snapshot), replayed
