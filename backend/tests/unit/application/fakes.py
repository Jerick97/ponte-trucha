"""Fakes en memoria para probar casos de uso sin AWS ni DynamoDB.

Los repositories en memoria viven en `ponte_trucha.adapters.in_memory_repositories`
(compartidos con el modo de desarrollo local sin DynamoDB); aquí solo se
agregan el reloj fijo y el generador de IDs deterministas que necesitan las
pruebas.
"""

from __future__ import annotations

from itertools import count

from ponte_trucha.adapters.in_memory_repositories import (
    InMemoryChildProfileRepository,
    InMemoryConsentRepository,
    InMemoryParentAccountRepository,
)
from ponte_trucha.application.ports import Clock, IdGenerator

__all__ = [
    "FixedClock",
    "InMemoryChildProfileRepository",
    "InMemoryConsentRepository",
    "InMemoryParentAccountRepository",
    "SequentialIdGenerator",
]


class FixedClock(Clock):
    def __init__(self, *, value: str = "2026-07-24T10:00:00Z") -> None:
        self._value = value

    def now(self) -> str:
        return self._value

    def advance_to(self, value: str) -> None:
        self._value = value


class SequentialIdGenerator(IdGenerator):
    def __init__(self) -> None:
        self._counter = count(1)

    def new_id(self, *, prefix: str) -> str:
        return f"{prefix}-{next(self._counter)}"
