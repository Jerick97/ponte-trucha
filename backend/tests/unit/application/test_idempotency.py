from __future__ import annotations

import pytest

from ponte_trucha.application.idempotency import (
    IdempotencyRecord,
    IdempotencyStore,
    execute_idempotently,
)
from ponte_trucha.domain.errors import IdempotencyConflictError


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


def test_first_call_executes_and_caches_result() -> None:
    store = InMemoryIdempotencyStore()
    calls = 0

    def run() -> dict[str, object]:
        nonlocal calls
        calls += 1
        return {"childId": "child-1"}

    body, replayed = execute_idempotently(
        store,
        parent_ref="ref-1",
        scope_key="ACCOUNT",
        operation="CreateChildProfile",
        idempotency_key="key-1",
        request_hash="hash-a",
        now="2026-07-24T10:00:00Z",
        run=run,
    )

    assert body == {"childId": "child-1"}
    assert replayed is False
    assert calls == 1


def test_repeated_call_with_same_request_replays_without_executing_again() -> None:
    store = InMemoryIdempotencyStore()
    calls = 0

    def run() -> dict[str, object]:
        nonlocal calls
        calls += 1
        return {"childId": "child-1"}

    execute_idempotently(
        store,
        parent_ref="ref-1",
        scope_key="ACCOUNT",
        operation="CreateChildProfile",
        idempotency_key="key-1",
        request_hash="hash-a",
        now="2026-07-24T10:00:00Z",
        run=run,
    )
    body, replayed = execute_idempotently(
        store,
        parent_ref="ref-1",
        scope_key="ACCOUNT",
        operation="CreateChildProfile",
        idempotency_key="key-1",
        request_hash="hash-a",
        now="2026-07-24T10:05:00Z",
        run=run,
    )

    assert body == {"childId": "child-1"}
    assert replayed is True
    assert calls == 1


def test_same_key_with_different_request_raises_conflict() -> None:
    store = InMemoryIdempotencyStore()

    execute_idempotently(
        store,
        parent_ref="ref-1",
        scope_key="ACCOUNT",
        operation="CreateChildProfile",
        idempotency_key="key-1",
        request_hash="hash-a",
        now="2026-07-24T10:00:00Z",
        run=lambda: {"childId": "child-1"},
    )

    with pytest.raises(IdempotencyConflictError):
        execute_idempotently(
            store,
            parent_ref="ref-1",
            scope_key="ACCOUNT",
            operation="CreateChildProfile",
            idempotency_key="key-1",
            request_hash="hash-b",
            now="2026-07-24T10:05:00Z",
            run=lambda: {"childId": "child-2"},
        )
