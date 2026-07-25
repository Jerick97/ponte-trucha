"""Repositories DynamoDB para cuenta adulta, consentimiento y perfiles.

Implementan los puertos de `ponte_trucha.application.ports` contra la tabla de
dominio `ptk-domain-{environment}` descrita en ADR-003. Usan el recurso
`boto3.resource("dynamodb").Table(...)`, que serializa tipos Python nativos, y
condiciones (`attribute_not_exists`/`attribute_exists`) para no pisar
ownership ni duplicar creaciones.

No se usa `Scan` en ningún método: solo `GetItem`, `PutItem`, `UpdateItem` y
`Query` acotados por `PK`.
"""

from __future__ import annotations

from typing import Any

from botocore.exceptions import ClientError

from ponte_trucha.adapters.dynamodb_keys import (
    ACCOUNT_SK,
    CONSENT_SK_PREFIX,
    PROFILE_SK_PREFIX,
    consent_sk,
    parent_pk,
    profile_sk,
)
from ponte_trucha.application.ports import (
    ChildProfileRepository,
    ConsentRepository,
    ParentAccountRepository,
)
from ponte_trucha.domain.child_profile import ChildProfile
from ponte_trucha.domain.consent import ConsentRecord
from ponte_trucha.domain.parent_account import ParentAccount
from ponte_trucha.domain.value_objects import (
    AccountStatus,
    AgeBand,
    ConsentPurpose,
    ConsentState,
    ProfileStatus,
)

# `Table` real es `boto3.resources.factory.dynamodb.Table`. No se declaran
# stubs de `mypy-boto3-dynamodb` sin acuerdo del equipo (ver AGENTS.md sobre
# dependencias nuevas); `Any` documenta la frontera con boto3 sin bloquear
# pyright en modo strict.
Table = Any


class ParentAccountDynamoDbRepository(ParentAccountRepository):
    """Persiste `ParentAccount` bajo `PARENT#{parentRef}` / `ACCOUNT`."""

    def __init__(self, table: Table) -> None:
        self._table = table

    def get(self, *, parent_ref: str) -> ParentAccount | None:
        response = self._table.get_item(
            Key={"PK": parent_pk(parent_ref), "SK": ACCOUNT_SK}, ConsistentRead=True
        )
        item = response.get("Item")
        return _account_from_item(item) if item else None

    def create(self, account: ParentAccount) -> None:
        try:
            self._table.put_item(
                Item=_account_to_item(account),
                ConditionExpression="attribute_not_exists(PK)",
            )
        except ClientError as error:
            if error.response["Error"]["Code"] == "ConditionalCheckFailedException":
                raise ValueError("La cuenta adulta ya existe.") from error
            raise

    def save(self, account: ParentAccount) -> None:
        self._table.put_item(Item=_account_to_item(account))

    def delete(self, *, parent_ref: str) -> None:
        self._table.delete_item(Key={"PK": parent_pk(parent_ref), "SK": ACCOUNT_SK})


class ConsentDynamoDbRepository(ConsentRepository):
    """Persiste `ConsentRecord` bajo `PARENT#{parentRef}` / `CONSENT#{purpose}`."""

    def __init__(self, table: Table) -> None:
        self._table = table

    def get(self, *, parent_ref: str, purpose: ConsentPurpose) -> ConsentRecord | None:
        response = self._table.get_item(
            Key={"PK": parent_pk(parent_ref), "SK": consent_sk(purpose.value)},
            ConsistentRead=True,
        )
        item = response.get("Item")
        return _consent_from_item(item) if item else None

    def list_for_parent(self, *, parent_ref: str) -> tuple[ConsentRecord, ...]:
        response = self._table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :prefix)",
            ExpressionAttributeValues={":pk": parent_pk(parent_ref), ":prefix": CONSENT_SK_PREFIX},
            ConsistentRead=True,
        )
        return tuple(_consent_from_item(item) for item in response.get("Items", []))

    def save(self, *, parent_ref: str, record: ConsentRecord) -> None:
        self._table.put_item(Item=_consent_to_item(parent_ref, record))

    def delete_for_parent(self, *, parent_ref: str) -> None:
        response = self._table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :prefix)",
            ExpressionAttributeValues={":pk": parent_pk(parent_ref), ":prefix": CONSENT_SK_PREFIX},
            ProjectionExpression="PK, SK",
        )
        with self._table.batch_writer() as batch:
            for item in response.get("Items", []):
                batch.delete_item(Key={"PK": item["PK"], "SK": item["SK"]})


class ChildProfileDynamoDbRepository(ChildProfileRepository):
    """Persiste `ChildProfile` bajo `PARENT#{parentRef}` / `PROFILE#{childId}`."""

    def __init__(self, table: Table) -> None:
        self._table = table

    def get(self, *, parent_ref: str, child_id: str) -> ChildProfile | None:
        response = self._table.get_item(
            Key={"PK": parent_pk(parent_ref), "SK": profile_sk(child_id)},
            ConsistentRead=True,
        )
        item = response.get("Item")
        return _profile_from_item(item) if item else None

    def list_for_parent(self, *, parent_ref: str) -> tuple[ChildProfile, ...]:
        response = self._table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :prefix)",
            ExpressionAttributeValues={":pk": parent_pk(parent_ref), ":prefix": PROFILE_SK_PREFIX},
            ConsistentRead=True,
        )
        return tuple(_profile_from_item(item) for item in response.get("Items", []))

    def create(self, *, parent_ref: str, profile: ChildProfile) -> None:
        try:
            self._table.put_item(
                Item=_profile_to_item(parent_ref, profile),
                ConditionExpression="attribute_not_exists(PK)",
            )
        except ClientError as error:
            if error.response["Error"]["Code"] == "ConditionalCheckFailedException":
                raise ValueError("El perfil ya existe.") from error
            raise

    def save(self, *, parent_ref: str, profile: ChildProfile) -> None:
        self._table.put_item(Item=_profile_to_item(parent_ref, profile))

    def delete(self, *, parent_ref: str, child_id: str) -> None:
        self._table.delete_item(Key={"PK": parent_pk(parent_ref), "SK": profile_sk(child_id)})

    def delete_for_parent(self, *, parent_ref: str) -> None:
        response = self._table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :prefix)",
            ExpressionAttributeValues={":pk": parent_pk(parent_ref), ":prefix": PROFILE_SK_PREFIX},
            ProjectionExpression="PK, SK",
        )
        with self._table.batch_writer() as batch:
            for item in response.get("Items", []):
                batch.delete_item(Key={"PK": item["PK"], "SK": item["SK"]})


def _account_to_item(account: ParentAccount) -> dict[str, Any]:
    return {
        "PK": parent_pk(account.parent_ref),
        "SK": ACCOUNT_SK,
        "entityType": "ParentAccount",
        "status": account.status.value,
        "ageGateRuleVersion": account.age_gate_rule_version,
        "ageGatePassedAt": account.age_gate_passed_at,
        "profileCount": account.profile_count,
        "revision": account.revision,
        "createdAt": account.created_at,
        "updatedAt": account.updated_at,
    }


def _account_from_item(item: dict[str, Any]) -> ParentAccount:
    return ParentAccount(
        parent_ref=item["PK"].removeprefix("PARENT#"),
        age_gate_rule_version=item["ageGateRuleVersion"],
        age_gate_passed_at=item["ageGatePassedAt"],
        profile_count=int(item["profileCount"]),
        created_at=item["createdAt"],
        updated_at=item["updatedAt"],
        revision=int(item["revision"]),
        status=AccountStatus(item["status"]),
    )


def _consent_to_item(parent_ref: str, record: ConsentRecord) -> dict[str, Any]:
    item: dict[str, Any] = {
        "PK": parent_pk(parent_ref),
        "SK": consent_sk(record.purpose.value),
        "entityType": "Consent",
        "purpose": record.purpose.value,
        "state": record.state.value,
        "policyVersion": record.policy_version,
        "method": record.method,
        "decidedAt": record.decided_at,
        "revision": record.revision,
    }
    if record.revoked_at is not None:
        item["revokedAt"] = record.revoked_at
    return item


def _consent_from_item(item: dict[str, Any]) -> ConsentRecord:
    return ConsentRecord(
        purpose=ConsentPurpose(item["purpose"]),
        state=ConsentState(item["state"]),
        policy_version=item["policyVersion"],
        method=item["method"],
        decided_at=item["decidedAt"],
        revision=int(item["revision"]),
        revoked_at=item.get("revokedAt"),
    )


def _profile_to_item(parent_ref: str, profile: ChildProfile) -> dict[str, Any]:
    return {
        "PK": parent_pk(parent_ref),
        "SK": profile_sk(profile.child_id),
        "entityType": "ChildProfile",
        "childId": profile.child_id,
        "aliasId": profile.alias_id,
        "avatarId": profile.avatar_id,
        "ageBand": profile.age_band.value,
        "status": profile.status.value,
        "createdAt": profile.created_at,
        "updatedAt": profile.updated_at,
        "revision": profile.revision,
    }


def _profile_from_item(item: dict[str, Any]) -> ChildProfile:
    return ChildProfile(
        child_id=item["childId"],
        alias_id=item["aliasId"],
        avatar_id=item["avatarId"],
        age_band=AgeBand(item["ageBand"]),
        created_at=item["createdAt"],
        updated_at=item["updatedAt"],
        revision=int(item["revision"]),
        status=ProfileStatus(item["status"]),
    )
