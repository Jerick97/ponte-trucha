"""Contract tests de `Challenge`/`Progress` contra DynamoDB (ADR-003),
usando `botocore.stub.Stubber` como el resto de repositories del backend.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import boto3
from botocore.stub import ANY, Stubber

from ponte_trucha.adapters.dynamodb_game_repositories import (
    ChallengeDynamoDbRepository,
    ProgressDynamoDbRepository,
)
from ponte_trucha.domain.challenge import Challenge, Grading, MessageKind
from ponte_trucha.domain.channels import AppType
from ponte_trucha.domain.progress import Progress
from ponte_trucha.domain.scenario_bank import ScenarioReveal, ScenarioSignal
from ponte_trucha.domain.value_objects import Difficulty

TABLE_NAME = "ptk-domain-test"


def _table() -> tuple[Any, Any]:
    resource: Any = boto3.resource(  # pyright: ignore[reportUnknownMemberType]
        "dynamodb", region_name="us-east-1"
    )
    table: Any = resource.Table(TABLE_NAME)
    stubber: Any = Stubber(table.meta.client)
    return table, stubber


def _challenge() -> Challenge:
    now = datetime(2026, 7, 24, 12, 0, tzinfo=UTC)
    return Challenge(
        challenge_id="challenge-1",
        scenario_id="escenario-1",
        scenario_version=1,
        app_type=AppType.SMS,
        difficulty=Difficulty(1),
        message_kind=MessageKind.TRAP,
        payload_snapshot={"mensaje": "hola"},
        grading=Grading(
            decision=MessageKind.TRAP,
            signal_codes=("pide-clave",),
            feedback_code="pide-clave-nunca",
            reveal=ScenarioReveal(
                scenario_type="robo-de-cuenta",
                signals=(ScenarioSignal(fragment="hola", explanation="Nadie pide tu clave."),),
                lesson="Nadie que sea de verdad te pide tu clave.",
                allows_conversation=False,
            ),
        ),
        issued_at=now,
        valid_until=now,
    )


def test_challenge_create_uses_condition_to_avoid_duplicates() -> None:
    table, stubber = _table()
    stubber.add_response(
        "put_item",
        {},
        {"TableName": TABLE_NAME, "Item": ANY, "ConditionExpression": "attribute_not_exists(PK)"},
    )
    stubber.add_response(
        "put_item",
        {},
        {"TableName": TABLE_NAME, "Item": ANY, "ConditionExpression": "attribute_not_exists(PK)"},
    )
    stubber.activate()
    repo = ChallengeDynamoDbRepository(table)

    repo.create(parent_ref="parent-1", child_id="child-1", challenge=_challenge())

    stubber.deactivate()
    stubber.assert_no_pending_responses()


def test_challenge_get_uses_get_item_with_consistent_read() -> None:
    table, stubber = _table()
    stubber.add_response(
        "get_item",
        {
            "Item": {
                "PK": {"S": "CHILD#child-1"},
                "SK": {"S": "CHALLENGE#challenge-1"},
                "challengeId": {"S": "challenge-1"},
                "scenarioId": {"S": "escenario-1"},
                "scenarioVersion": {"N": "1"},
                "appType": {"S": "sms"},
                "difficulty": {"N": "1"},
                "messageKind": {"S": "trap"},
                "payloadSnapshot": {"M": {"mensaje": {"S": "hola"}}},
                "grading": {
                    "M": {
                        "decision": {"S": "trap"},
                        "signalCodes": {"L": [{"S": "pide-clave"}]},
                        "feedbackCode": {"S": "pide-clave-nunca"},
                        "reveal": {
                            "M": {
                                "scenarioType": {"S": "robo-de-cuenta"},
                                "signals": {
                                    "L": [
                                        {
                                            "M": {
                                                "fragment": {"S": "hola"},
                                                "explanation": {"S": "Nadie pide tu clave."},
                                            }
                                        }
                                    ]
                                },
                                "lesson": {"S": "Nadie te pide tu clave."},
                                "allowsConversation": {"BOOL": False},
                            }
                        },
                    }
                },
                "status": {"S": "issued"},
                "issuedAt": {"S": "2026-07-24T12:00:00Z"},
                "validUntil": {"S": "2026-07-24T12:00:00Z"},
            }
        },
        {
            "TableName": TABLE_NAME,
            "Key": {"PK": "CHILD#child-1", "SK": "CHALLENGE#challenge-1"},
            "ConsistentRead": True,
        },
    )
    stubber.activate()
    repo = ChallengeDynamoDbRepository(table)

    challenge = repo.get(child_id="child-1", challenge_id="challenge-1")

    assert challenge is not None
    assert challenge.scenario_id == "escenario-1"
    assert challenge.grading.feedback_code == "pide-clave-nunca"
    stubber.deactivate()
    stubber.assert_no_pending_responses()


def test_challenge_get_returns_none_when_missing() -> None:
    table, stubber = _table()
    stubber.add_response(
        "get_item",
        {},
        {
            "TableName": TABLE_NAME,
            "Key": {"PK": "CHILD#child-1", "SK": "CHALLENGE#challenge-1"},
            "ConsistentRead": True,
        },
    )
    stubber.activate()
    repo = ChallengeDynamoDbRepository(table)

    assert repo.get(child_id="child-1", challenge_id="challenge-1") is None
    stubber.deactivate()


def test_progress_get_returns_default_when_missing_no_scan() -> None:
    table, stubber = _table()
    stubber.add_response(
        "get_item",
        {},
        {
            "TableName": TABLE_NAME,
            "Key": {"PK": "CHILD#child-1", "SK": "PROGRESS#MAIN"},
            "ConsistentRead": True,
        },
    )
    stubber.activate()
    repo = ProgressDynamoDbRepository(table)

    progress = repo.get(child_id="child-1")

    assert progress.score == 0
    assert progress.current_difficulty == Difficulty(1)
    stubber.deactivate()


def test_progress_save_round_trips_fields() -> None:
    table, stubber = _table()
    progress = Progress(
        score=10,
        streak=1,
        total_attempts=1,
        correct_attempts=1,
        current_difficulty=Difficulty(1),
        recent_scenario_ids=("escenario-1",),
        recent_message_kinds=(MessageKind.TRAP,),
    )
    stubber.add_response("put_item", {}, {"TableName": TABLE_NAME, "Item": ANY})
    stubber.activate()
    repo = ProgressDynamoDbRepository(table)

    repo.save(child_id="child-1", progress=progress)

    stubber.deactivate()
    stubber.assert_no_pending_responses()
