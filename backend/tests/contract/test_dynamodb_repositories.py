"""Contract tests: los repositories DynamoDB cumplen los Protocols y el
esquema de claves de ADR-003, usando `botocore.stub.Stubber` en vez de una
tabla real (no hay Docker/Floci disponible en este entorno local).
"""

from __future__ import annotations

from typing import Any

import boto3
from botocore.stub import ANY, Stubber

from ponte_trucha.adapters.dynamodb_repositories import (
    ChildProfileDynamoDbRepository,
    ConsentDynamoDbRepository,
    ParentAccountDynamoDbRepository,
)
from ponte_trucha.domain.child_profile import ChildProfile
from ponte_trucha.domain.consent import ConsentRecord
from ponte_trucha.domain.parent_account import ParentAccount
from ponte_trucha.domain.value_objects import AgeBand, ConsentPurpose

TABLE_NAME = "ptk-domain-test"


def _table() -> tuple[Any, Any]:
    # boto3 no publica stubs oficiales sin agregar `mypy-boto3-dynamodb`; el
    # límite dinámico se documenta aquí igual que en `composition.py`.
    resource: Any = boto3.resource(  # pyright: ignore[reportUnknownMemberType]
        "dynamodb", region_name="us-east-1"
    )
    table: Any = resource.Table(TABLE_NAME)
    stubber: Any = Stubber(table.meta.client)
    return table, stubber


def test_parent_account_get_uses_get_item_with_consistent_read_and_no_scan() -> None:
    table, stubber = _table()
    stubber.add_response(
        "get_item",
        {
            "Item": {
                "PK": {"S": "PARENT#ref-1"},
                "SK": {"S": "ACCOUNT"},
                "entityType": {"S": "ParentAccount"},
                "status": {"S": "active"},
                "ageGateRuleVersion": {"S": "age-gate-v1"},
                "ageGatePassedAt": {"S": "2026-07-24T10:00:00Z"},
                "profileCount": {"N": "0"},
                "revision": {"N": "0"},
                "createdAt": {"S": "2026-07-24T10:00:00Z"},
                "updatedAt": {"S": "2026-07-24T10:00:00Z"},
            }
        },
        {
            "TableName": TABLE_NAME,
            "Key": {"PK": "PARENT#ref-1", "SK": "ACCOUNT"},
            "ConsistentRead": True,
        },
    )
    stubber.activate()
    repo = ParentAccountDynamoDbRepository(table)

    account = repo.get(parent_ref="ref-1")

    assert account is not None
    assert account.parent_ref == "ref-1"
    assert account.profile_count == 0
    stubber.deactivate()
    stubber.assert_no_pending_responses()


def test_parent_account_get_returns_none_when_missing() -> None:
    table, stubber = _table()
    stubber.add_response(
        "get_item",
        {},
        {
            "TableName": TABLE_NAME,
            "Key": {"PK": "PARENT#ref-1", "SK": "ACCOUNT"},
            "ConsistentRead": True,
        },
    )
    stubber.activate()
    repo = ParentAccountDynamoDbRepository(table)

    assert repo.get(parent_ref="ref-1") is None
    stubber.deactivate()


def test_parent_account_create_uses_condition_to_avoid_duplicates() -> None:
    table, stubber = _table()
    account = ParentAccount.create(
        parent_ref="ref-1", age_gate_rule_version="age-gate-v1", now="2026-07-24T10:00:00Z"
    )
    stubber.add_response(
        "put_item",
        {},
        {
            "TableName": TABLE_NAME,
            "Item": ANY,
            "ConditionExpression": "attribute_not_exists(PK)",
        },
    )
    stubber.activate()
    repo = ParentAccountDynamoDbRepository(table)

    repo.create(account)

    stubber.deactivate()
    stubber.assert_no_pending_responses()


def test_consent_list_for_parent_uses_query_with_begins_with_no_scan() -> None:
    table, stubber = _table()
    stubber.add_response(
        "query",
        {
            "Items": [
                {
                    "PK": {"S": "PARENT#ref-1"},
                    "SK": {"S": "CONSENT#core"},
                    "purpose": {"S": "core"},
                    "state": {"S": "granted"},
                    "policyVersion": {"S": "privacy-v1"},
                    "method": {"S": "explicit-click"},
                    "decidedAt": {"S": "2026-07-24T10:00:00Z"},
                    "revision": {"N": "1"},
                }
            ]
        },
        {
            "TableName": TABLE_NAME,
            "KeyConditionExpression": "PK = :pk AND begins_with(SK, :prefix)",
            "ExpressionAttributeValues": {":pk": "PARENT#ref-1", ":prefix": "CONSENT#"},
            "ConsistentRead": True,
        },
    )
    stubber.activate()
    repo = ConsentDynamoDbRepository(table)

    records = repo.list_for_parent(parent_ref="ref-1")

    assert len(records) == 1
    assert records[0].purpose == ConsentPurpose.CORE
    stubber.deactivate()
    stubber.assert_no_pending_responses()


def test_consent_save_round_trips_all_fields() -> None:
    table, stubber = _table()
    record = ConsentRecord.initial(
        ConsentPurpose.CORE, policy_version="privacy-v1", now="2026-07-24T10:00:00Z"
    )
    stubber.add_response("put_item", {}, {"TableName": TABLE_NAME, "Item": ANY})
    stubber.activate()
    repo = ConsentDynamoDbRepository(table)

    repo.save(parent_ref="ref-1", record=record)

    stubber.deactivate()
    stubber.assert_no_pending_responses()


def test_child_profile_list_for_parent_uses_query_scoped_to_profile_prefix() -> None:
    table, stubber = _table()
    stubber.add_response(
        "query",
        {
            "Items": [
                {
                    "PK": {"S": "PARENT#ref-1"},
                    "SK": {"S": "PROFILE#child-1"},
                    "childId": {"S": "child-1"},
                    "aliasId": {"S": "alias-zorro"},
                    "avatarId": {"S": "avatar-01"},
                    "ageBand": {"S": "8-10"},
                    "status": {"S": "active"},
                    "createdAt": {"S": "2026-07-24T10:00:00Z"},
                    "updatedAt": {"S": "2026-07-24T10:00:00Z"},
                    "revision": {"N": "0"},
                }
            ]
        },
        {
            "TableName": TABLE_NAME,
            "KeyConditionExpression": "PK = :pk AND begins_with(SK, :prefix)",
            "ExpressionAttributeValues": {":pk": "PARENT#ref-1", ":prefix": "PROFILE#"},
            "ConsistentRead": True,
        },
    )
    stubber.activate()
    repo = ChildProfileDynamoDbRepository(table)

    profiles = repo.list_for_parent(parent_ref="ref-1")

    assert len(profiles) == 1
    assert profiles[0].child_id == "child-1"
    assert profiles[0].age_band == AgeBand.EIGHT_TO_TEN
    stubber.deactivate()
    stubber.assert_no_pending_responses()


def test_child_profile_create_uses_condition_and_delete_uses_key_only() -> None:
    table, stubber = _table()
    profile = ChildProfile.create(
        child_id="child-1",
        alias_id="alias-zorro",
        avatar_id="avatar-01",
        age_band=AgeBand.EIGHT_TO_TEN,
        now="2026-07-24T10:00:00Z",
    )
    stubber.add_response(
        "put_item",
        {},
        {"TableName": TABLE_NAME, "Item": ANY, "ConditionExpression": "attribute_not_exists(PK)"},
    )
    stubber.add_response(
        "delete_item",
        {},
        {"TableName": TABLE_NAME, "Key": {"PK": "PARENT#ref-1", "SK": "PROFILE#child-1"}},
    )
    stubber.activate()
    repo = ChildProfileDynamoDbRepository(table)

    repo.create(parent_ref="ref-1", profile=profile)
    repo.delete(parent_ref="ref-1", child_id="child-1")

    stubber.deactivate()
    stubber.assert_no_pending_responses()
