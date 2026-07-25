"""Guardia de idempotencia para mutaciones sensibles (ADR-003, simplificado).

El modelo completo de ADR-003 incluye estados `inProgress`/`completed` y
workflows de borrado reanudables por cursor; esa máquina completa se
implementa junto con la tarea de retos/intentos (backend-serverless #16) y con
el borrado transaccional (autenticacion-consentimiento-parental #10).

Para consentimiento y perfiles, esta guía cubre la garantía esencial exigida
por R6: repetir la misma `Idempotency-Key` con el mismo request devuelve el
mismo resultado sin re-ejecutar la mutación; una clave repetida con un request
distinto devuelve `IDEMPOTENCY_CONFLICT`.
"""

from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass
from typing import Protocol

from ponte_trucha.domain.errors import IdempotencyConflictError


@dataclass(frozen=True, slots=True)
class IdempotencyRecord:
    """Resultado cacheado de una mutación idempotente ya ejecutada."""

    parent_ref: str
    scope_key: str
    operation: str
    idempotency_key: str
    request_hash: str
    response_body: Mapping[str, object]
    created_at: str


class IdempotencyStore(Protocol):
    """Puerto de persistencia de `IdempotencyRecord`."""

    def get(
        self, *, parent_ref: str, scope_key: str, operation: str, idempotency_key: str
    ) -> IdempotencyRecord | None: ...

    def put(self, record: IdempotencyRecord) -> None: ...


def execute_idempotently(
    store: IdempotencyStore,
    *,
    parent_ref: str,
    scope_key: str,
    operation: str,
    idempotency_key: str,
    request_hash: str,
    now: str,
    run: Callable[[], Mapping[str, object]],
) -> tuple[Mapping[str, object], bool]:
    """Ejecuta `run` una sola vez por `idempotency_key` y devuelve `(body, replayed)`."""

    existing = store.get(
        parent_ref=parent_ref,
        scope_key=scope_key,
        operation=operation,
        idempotency_key=idempotency_key,
    )
    if existing is not None:
        if existing.request_hash != request_hash:
            raise IdempotencyConflictError(
                f"Idempotency-Key reutilizada con un request distinto para {operation}."
            )
        return existing.response_body, True

    response_body = run()
    store.put(
        IdempotencyRecord(
            parent_ref=parent_ref,
            scope_key=scope_key,
            operation=operation,
            idempotency_key=idempotency_key,
            request_hash=request_hash,
            response_body=response_body,
            created_at=now,
        )
    )
    return response_body, False
