"""Repositories DynamoDB del loop de juego (ADR-003, partición infantil).

Persiste retos, intentos y progreso con TTL explícito y localizadores de reto
acotados al adulto. Las operaciones usan `GetItem`, `PutItem`, `DeleteItem` y
`Query`; nunca `Scan`. La futura unidad transaccional de la tarea 16 debe
reutilizar estas formas de ítem y agregar control de concurrencia optimista.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from ponte_trucha.adapters.dynamodb_game_keys import (
    PROGRESS_SK,
    attempt_sk,
    challenge_sk,
    child_pk,
)
from ponte_trucha.adapters.dynamodb_keys import challenge_locator_sk, parent_pk
from ponte_trucha.application.ports import (
    AttemptRepository,
    ChallengeRepository,
    ProgressRepository,
)
from ponte_trucha.domain.attempt import Attempt
from ponte_trucha.domain.challenge import Challenge, ChallengeStatus, Grading, MessageKind
from ponte_trucha.domain.channels import AppType
from ponte_trucha.domain.progress import Progress
from ponte_trucha.domain.scenario_bank import ScenarioReveal
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

    def locate_child(self, *, parent_ref: str, challenge_id: str) -> str | None:
        response = self._table.get_item(
            Key={
                "PK": parent_pk(parent_ref),
                "SK": challenge_locator_sk(challenge_id),
            },
            ConsistentRead=True,
        )
        item = response.get("Item")
        return str(item["childId"]) if item else None

    def create(self, *, parent_ref: str, child_id: str, challenge: Challenge) -> None:
        self._table.put_item(
            Item=_challenge_to_item(child_id, challenge),
            ConditionExpression="attribute_not_exists(PK)",
        )
        self._table.put_item(
            Item={
                "PK": parent_pk(parent_ref),
                "SK": challenge_locator_sk(challenge.challenge_id),
                "entityType": "ChallengeLocator",
                "childId": child_id,
                "createdAt": challenge.issued_at.isoformat().replace("+00:00", "Z"),
                "validUntil": challenge.valid_until.isoformat().replace("+00:00", "Z"),
                "expiresAt": int(challenge.valid_until.timestamp()) + 7 * 24 * 60 * 60,
            },
            ConditionExpression="attribute_not_exists(PK)",
        )

    def save(self, *, child_id: str, challenge: Challenge) -> None:
        self._table.put_item(Item=_challenge_to_item(child_id, challenge))

    def delete_for_child(self, *, parent_ref: str, child_id: str) -> None:
        child_response = self._table.query(
            KeyConditionExpression="PK = :pk",
            ExpressionAttributeValues={":pk": child_pk(child_id)},
            ProjectionExpression="PK, SK",
        )
        with self._table.batch_writer() as batch:
            for item in child_response.get("Items", []):
                batch.delete_item(Key={"PK": item["PK"], "SK": item["SK"]})

        locator_response = self._table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :prefix)",
            FilterExpression="childId = :child_id",
            ExpressionAttributeValues={
                ":pk": parent_pk(parent_ref),
                ":prefix": "CHALLENGE#",
                ":child_id": child_id,
            },
            ProjectionExpression="PK, SK, childId",
        )
        with self._table.batch_writer() as batch:
            for item in locator_response.get("Items", []):
                batch.delete_item(Key={"PK": item["PK"], "SK": item["SK"]})


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

    def delete(self, *, child_id: str) -> None:
        self._table.delete_item(Key={"PK": child_pk(child_id), "SK": PROGRESS_SK})


class AttemptDynamoDbRepository(AttemptRepository):
    def __init__(self, table: Table) -> None:
        self._table = table

    def create(self, *, child_id: str, attempt: Attempt) -> None:
        answered_at = attempt.answered_at.isoformat().replace("+00:00", "Z")
        self._table.put_item(
            Item={
                "PK": child_pk(child_id),
                "SK": attempt_sk(answered_at, attempt.attempt_id),
                "entityType": "Attempt",
                "attemptId": attempt.attempt_id,
                "challengeId": attempt.challenge_id,
                "scenarioId": attempt.scenario_id,
                "appType": attempt.app_type.value,
                "difficulty": attempt.difficulty.value,
                "decision": attempt.decision.value,
                "isCorrect": attempt.is_correct,
                "pointsAwarded": attempt.points_awarded,
                "feedbackCode": attempt.feedback_code,
                "responseTimeBucket": str(attempt.response_time_bucket),
                "answeredAt": answered_at,
                "expiresAt": int(attempt.answered_at.timestamp()) + 30 * 24 * 60 * 60,
            },
            ConditionExpression="attribute_not_exists(PK)",
        )

    def delete_for_child(self, *, child_id: str) -> None:
        response = self._table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :prefix)",
            ExpressionAttributeValues={":pk": child_pk(child_id), ":prefix": "ATTEMPT#"},
            ProjectionExpression="PK, SK",
        )
        with self._table.batch_writer() as batch:
            for item in response.get("Items", []):
                batch.delete_item(Key={"PK": item["PK"], "SK": item["SK"]})


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
            "reveal": challenge.grading.reveal.to_snapshot(),
        },
        "status": challenge.status.value,
        "issuedAt": challenge.issued_at.isoformat().replace("+00:00", "Z"),
        "validUntil": challenge.valid_until.isoformat().replace("+00:00", "Z"),
        "expiresAt": int(challenge.valid_until.timestamp()) + 7 * 24 * 60 * 60,
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
            reveal=ScenarioReveal.from_snapshot(grading_item["reveal"]),
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
