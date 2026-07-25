"""Repositories en memoria: fallback de desarrollo local sin DynamoDB.

Nunca se usan cuando `DOMAIN_TABLE_NAME` está configurado (ver `composition.py`).
Cada invocación Lambda obtiene un proceso nuevo, así que estas instancias solo
tienen sentido para `uvicorn` local o pruebas manuales sin AWS.
"""

from __future__ import annotations

from ponte_trucha.application.idempotency import IdempotencyRecord, IdempotencyStore
from ponte_trucha.application.ports import (
    AttemptRepository,
    ChallengeRepository,
    ChildProfileRepository,
    ConsentRepository,
    ParentAccountRepository,
    ProgressRepository,
)
from ponte_trucha.domain.attempt import Attempt
from ponte_trucha.domain.challenge import Challenge
from ponte_trucha.domain.child_profile import ChildProfile
from ponte_trucha.domain.consent import ConsentRecord
from ponte_trucha.domain.parent_account import ParentAccount
from ponte_trucha.domain.progress import Progress
from ponte_trucha.domain.value_objects import ConsentPurpose, Difficulty


class InMemoryParentAccountRepository(ParentAccountRepository):
    def __init__(self) -> None:
        self._accounts: dict[str, ParentAccount] = {}

    def get(self, *, parent_ref: str) -> ParentAccount | None:
        return self._accounts.get(parent_ref)

    def create(self, account: ParentAccount) -> None:
        self._accounts[account.parent_ref] = account

    def save(self, account: ParentAccount) -> None:
        self._accounts[account.parent_ref] = account

    def delete(self, *, parent_ref: str) -> None:
        self._accounts.pop(parent_ref, None)


class InMemoryConsentRepository(ConsentRepository):
    def __init__(self) -> None:
        self._records: dict[tuple[str, ConsentPurpose], ConsentRecord] = {}

    def get(self, *, parent_ref: str, purpose: ConsentPurpose) -> ConsentRecord | None:
        return self._records.get((parent_ref, purpose))

    def list_for_parent(self, *, parent_ref: str) -> tuple[ConsentRecord, ...]:
        return tuple(
            record for (ref, _purpose), record in self._records.items() if ref == parent_ref
        )

    def save(self, *, parent_ref: str, record: ConsentRecord) -> None:
        self._records[(parent_ref, record.purpose)] = record

    def delete_for_parent(self, *, parent_ref: str) -> None:
        self._records = {
            key: record for key, record in self._records.items() if key[0] != parent_ref
        }


class InMemoryChildProfileRepository(ChildProfileRepository):
    def __init__(self) -> None:
        self._profiles: dict[tuple[str, str], ChildProfile] = {}

    def get(self, *, parent_ref: str, child_id: str) -> ChildProfile | None:
        return self._profiles.get((parent_ref, child_id))

    def list_for_parent(self, *, parent_ref: str) -> tuple[ChildProfile, ...]:
        return tuple(
            profile for (ref, _child_id), profile in self._profiles.items() if ref == parent_ref
        )

    def create(self, *, parent_ref: str, profile: ChildProfile) -> None:
        self._profiles[(parent_ref, profile.child_id)] = profile

    def save(self, *, parent_ref: str, profile: ChildProfile) -> None:
        self._profiles[(parent_ref, profile.child_id)] = profile

    def delete(self, *, parent_ref: str, child_id: str) -> None:
        self._profiles.pop((parent_ref, child_id), None)

    def delete_for_parent(self, *, parent_ref: str) -> None:
        self._profiles = {
            key: profile for key, profile in self._profiles.items() if key[0] != parent_ref
        }


class InMemoryChallengeRepository(ChallengeRepository):
    def __init__(self) -> None:
        self._challenges: dict[tuple[str, str], Challenge] = {}
        self._locators: dict[tuple[str, str], str] = {}

    def get(self, *, child_id: str, challenge_id: str) -> Challenge | None:
        return self._challenges.get((child_id, challenge_id))

    def locate_child(self, *, parent_ref: str, challenge_id: str) -> str | None:
        return self._locators.get((parent_ref, challenge_id))

    def create(self, *, parent_ref: str, child_id: str, challenge: Challenge) -> None:
        self._challenges[(child_id, challenge.challenge_id)] = challenge
        self._locators[(parent_ref, challenge.challenge_id)] = child_id

    def save(self, *, child_id: str, challenge: Challenge) -> None:
        self._challenges[(child_id, challenge.challenge_id)] = challenge

    def delete_for_child(self, *, parent_ref: str, child_id: str) -> None:
        self._challenges = {
            key: challenge for key, challenge in self._challenges.items() if key[0] != child_id
        }
        self._locators = {
            key: located_child
            for key, located_child in self._locators.items()
            if not (key[0] == parent_ref and located_child == child_id)
        }


class InMemoryProgressRepository(ProgressRepository):
    def __init__(self) -> None:
        self._progress: dict[str, Progress] = {}

    def get(self, *, child_id: str) -> Progress:
        return self._progress.get(
            child_id,
            Progress(
                score=0,
                streak=0,
                total_attempts=0,
                correct_attempts=0,
                current_difficulty=Difficulty(1),
            ),
        )

    def save(self, *, child_id: str, progress: Progress) -> None:
        self._progress[child_id] = progress

    def delete(self, *, child_id: str) -> None:
        self._progress.pop(child_id, None)


class InMemoryAttemptRepository(AttemptRepository):
    def __init__(self) -> None:
        self._attempts: dict[str, list[Attempt]] = {}

    def create(self, *, child_id: str, attempt: Attempt) -> None:
        self._attempts.setdefault(child_id, []).append(attempt)

    def delete_for_child(self, *, child_id: str) -> None:
        self._attempts.pop(child_id, None)


class InMemoryIdempotencyStore(IdempotencyStore):
    def __init__(self) -> None:
        self._records: dict[tuple[str, str, str, str], IdempotencyRecord] = {}

    def get(
        self, *, parent_ref: str, scope_key: str, operation: str, idempotency_key: str
    ) -> IdempotencyRecord | None:
        return self._records.get((parent_ref, scope_key, operation, idempotency_key))

    def put(self, record: IdempotencyRecord) -> None:
        key = (record.parent_ref, record.scope_key, record.operation, record.idempotency_key)
        self._records[key] = record
