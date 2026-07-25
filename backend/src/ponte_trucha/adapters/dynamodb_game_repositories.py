"""Repositories DynamoDB de `Challenge` y `Progress` (ADR-003, partición infantil).

Alcance actual: solo lo que necesita `IssueNextChallenge`
(`GET /v1/perfiles/{childId}/retos/siguiente`) — crear/leer un `Challenge` y
leer/guardar `Progress`. La transacción de intento (`POST .../intentos`,
tarea 16) todavía no existe, así que estos repositories no implementan
`revision` con control de concurrencia optimista ni `expiresAt`/TTL; ADR-003
los define para esa tarea, que debe extenderlos, no reemplazarlos.

Sin `Scan`: solo `GetItem`, `PutItem` y `Query` acotados por `PK`.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from ponte_trucha.adapters.dynamodb_game_keys import PROGRESS_SK, challenge_sk, child_pk
from ponte_trucha.application.ports import ChallengeRepository, ProgressRepository
from ponte_trucha.domain.challenge import Challenge, ChallengeStatus, Grading, MessageKind
from ponte_trucha.domain.channels import AppType
from ponte_trucha.domain.progress import Progress
from ponte_trucha.domain.value_objects import Difficulty

Table = Any


class ChallengeDynamoDbRepository(ChallengeRepository):
    """Persiste `Challenge` bajo `CHILD#{childId}` / `CHALLENGE#{challengeId}`."""

    def __init__(self, table: Table) -> None:
        self._table = table

    def get(self, *, child_id: str, challenge_id: str) -> Challenge | None:
        response = self._table.get_item(
            Key={"PK": child_pk(child_id), "SK": challenge_sk(challenge_id)},
            ConsistentRead=True,
        )
        item = response.get("Item")
        return _challenge_from_item(item) if item else None

    def create(self, *, child_id: str, challenge: Challenge) -> None:
        self._table.put_item(
            Item=_challenge_to_item(child_id, challenge),
            ConditionExpression="attribute_not_exists(PK)",
        )

    def save(self, *, child_id: str, challenge: Challenge) -> None:
        self._table.put_item(Item=_challenge_to_item(child_id, challenge))


class ProgressDynamoDbRepository(ProgressRepository):
    """Persiste `Progress` bajo `CHILD#{childId}` / `PROGRESS#MAIN`."""

    def __init__(self, table: Table) -> None:
        self._table = table

    def get(self, *, child_id: str) -> Progress:
        response = self._table.get_item(
            Key={"PK": child_pk(child_id), "SK": PROGRESS_SK}, ConsistentRead=True
        )
        item = response.get("Item")
        if item is None:
            return Progress(
                score=0,
                streak=0,
                total_attempts=0,
                correct_attempts=0,
                current_difficulty=Difficulty(1),
            )
        return _progress_from_item(item)

    def save(self, *, child_id: str, progress: Progress) -> None:
        self._table.put_item(Item=_progress_to_item(child_id, progress))


def _challenge_to_item(child_id: str, challenge: Challenge) -> dict[str, Any]:
    item: dict[str, Any] = {
        "PK": child_pk(child_id),
        "SK": challenge_sk(challenge.challenge_id),
        "entityType": "Challenge",
        "challengeId": challenge.challenge_id,
        "scenarioId": challenge.scenario_id,
        "scenarioVersion": challenge.scenario_version,
        "source": "curated",
        "appType": challenge.app_type.value,
        "difficulty": challenge.difficulty.value,
        "messageKind": challenge.message_kind.value,
        "payloadSnapshot": challenge.payload_snapshot,
        "grading": {
            "decision": challenge.grading.decision.value,
            "signalCodes": list(challenge.grading.signal_codes),
            "feedbackCode": challenge.grading.feedback_code,
        },
        "status": challenge.status.value,
        "issuedAt": challenge.issued_at.isoformat().replace("+00:00", "Z"),
        "validUntil": challenge.valid_until.isoformat().replace("+00:00", "Z"),
    }
    if challenge.answered_at is not None:
        item["answeredAt"] = challenge.answered_at.isoformat().replace("+00:00", "Z")
    return item


def _challenge_from_item(item: dict[str, Any]) -> Challenge:
    grading_item = item["grading"]
    return Challenge(
        challenge_id=item["challengeId"],
        scenario_id=item["scenarioId"],
        scenario_version=int(item["scenarioVersion"]),
        app_type=AppType(item["appType"]),
        difficulty=Difficulty(int(item["difficulty"])),
        message_kind=MessageKind(item["messageKind"]),
        payload_snapshot=dict(item["payloadSnapshot"]),
        grading=Grading(
            decision=MessageKind(grading_item["decision"]),
            signal_codes=tuple(grading_item["signalCodes"]),
            feedback_code=grading_item["feedbackCode"],
        ),
        issued_at=datetime.fromisoformat(item["issuedAt"].replace("Z", "+00:00")),
        valid_until=datetime.fromisoformat(item["validUntil"].replace("Z", "+00:00")),
        status=ChallengeStatus(item["status"]),
        answered_at=(
            datetime.fromisoformat(item["answeredAt"].replace("Z", "+00:00"))
            if "answeredAt" in item
            else None
        ),
    )


def _progress_to_item(child_id: str, progress: Progress) -> dict[str, Any]:
    return {
        "PK": child_pk(child_id),
        "SK": PROGRESS_SK,
        "entityType": "Progress",
        "score": progress.score,
        "streak": progress.streak,
        "totalAttempts": progress.total_attempts,
        "correctAttempts": progress.correct_attempts,
        "currentDifficulty": progress.current_difficulty.value,
        "recentScenarioIds": list(progress.recent_scenario_ids),
        "recentMessageKinds": [kind.value for kind in progress.recent_message_kinds],
    }


def _progress_from_item(item: dict[str, Any]) -> Progress:
    return Progress(
        score=int(item["score"]),
        streak=int(item["streak"]),
        total_attempts=int(item["totalAttempts"]),
        correct_attempts=int(item["correctAttempts"]),
        current_difficulty=Difficulty(int(item["currentDifficulty"])),
        recent_scenario_ids=tuple(item.get("recentScenarioIds", [])),
        recent_message_kinds=tuple(
            MessageKind(kind) for kind in item.get("recentMessageKinds", [])
        ),
    )
