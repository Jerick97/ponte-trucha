"""Persistencia temporal de resultados idempotentes en la tabla dedicada."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from ponte_trucha.adapters.dynamodb_keys import parent_pk
from ponte_trucha.adapters.hmac_digest import compute_digest
from ponte_trucha.application.idempotency import IdempotencyRecord, IdempotencyStore

Table = Any


class DynamoDbIdempotencyStore(IdempotencyStore):
    def __init__(self, table: Table, *, secret_key: bytes) -> None:
        self._table = table
        self._secret_key = secret_key

    def _sort_key(self, *, scope_key: str, operation: str, idempotency_key: str) -> str:
        digest = compute_digest(
            secret_key=self._secret_key,
            payload=f"{operation}|{idempotency_key}",
        )
        return f"SCOPE#{scope_key}#IDEMP#{operation}#{digest}"

    def get(
        self, *, parent_ref: str, scope_key: str, operation: str, idempotency_key: str
    ) -> IdempotencyRecord | None:
        response = self._table.get_item(
            Key={
                "PK": parent_pk(parent_ref),
                "SK": self._sort_key(
                    scope_key=scope_key,
                    operation=operation,
                    idempotency_key=idempotency_key,
                ),
            },
            ConsistentRead=True,
        )
        item = response.get("Item")
        if item is None:
            return None
        return IdempotencyRecord(
            parent_ref=parent_ref,
            scope_key=scope_key,
            operation=operation,
            idempotency_key=idempotency_key,
            request_hash=item["requestHash"],
            response_body=dict(item["responseSnapshot"]),
            created_at=item["createdAt"],
        )

    def put(self, record: IdempotencyRecord) -> None:
        created_at = datetime.fromisoformat(record.created_at.replace("Z", "+00:00"))
        self._table.put_item(
            Item={
                "PK": parent_pk(record.parent_ref),
                "SK": self._sort_key(
                    scope_key=record.scope_key,
                    operation=record.operation,
                    idempotency_key=record.idempotency_key,
                ),
                "entityType": "IdempotencyRecord",
                "operation": record.operation,
                "requestHash": record.request_hash,
                "state": "completed",
                "responseSnapshot": dict(record.response_body),
                "createdAt": record.created_at,
                "updatedAt": record.created_at,
                "expiresAt": int(created_at.timestamp()) + 7 * 24 * 60 * 60,
            },
            ConditionExpression="attribute_not_exists(PK)",
        )
