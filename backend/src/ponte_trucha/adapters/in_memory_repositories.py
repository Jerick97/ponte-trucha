"""Repositories en memoria: fallback de desarrollo local sin DynamoDB.

Nunca se usan cuando `DOMAIN_TABLE_NAME` está configurado (ver `composition.py`).
Cada invocación Lambda obtiene un proceso nuevo, así que estas instancias solo
tienen sentido para `uvicorn` local o pruebas manuales sin AWS.
"""

from __future__ import annotations

from ponte_trucha.application.ports import (
    ChallengeRepository,
    ChildProfileRepository,
    ConsentRepository,
    ParentAccountRepository,
    ProgressRepository,
)
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


class InMemoryChallengeRepository(ChallengeRepository):
    def __init__(self) -> None:
        self._challenges: dict[tuple[str, str], Challenge] = {}

    def get(self, *, child_id: str, challenge_id: str) -> Challenge | None:
        return self._challenges.get((child_id, challenge_id))

    def create(self, *, child_id: str, challenge: Challenge) -> None:
        self._challenges[(child_id, challenge.challenge_id)] = challenge

    def save(self, *, child_id: str, challenge: Challenge) -> None:
        self._challenges[(child_id, challenge.challenge_id)] = challenge


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
