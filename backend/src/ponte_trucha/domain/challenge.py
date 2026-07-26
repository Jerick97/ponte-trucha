"""Entidad `Challenge`: un reto emitido a un perfil infantil.

Refleja el modelo lógico de ADR-003. `payload_snapshot` es lo único visible
para el cliente; `grading` (decisión correcta, señales y feedback) nunca se
serializa hacia afuera antes del intento.

Sin dependencias externas: dominio puro.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

from ponte_trucha.domain.channels import AppType
from ponte_trucha.domain.errors import DomainError
from ponte_trucha.domain.scenario_bank import ScenarioReveal
from ponte_trucha.domain.value_objects import Difficulty


class ChallengeStatus(StrEnum):
    ISSUED = "issued"
    ANSWERED = "answered"
    EXPIRED = "expired"


class MessageKind(StrEnum):
    TRAP = "trap"
    LEGITIMATE = "legitimate"


class ChallengeAlreadyAnsweredError(DomainError):
    """Se intentó responder un reto que ya tiene un intento calificado."""

    code = "CHALLENGE_ALREADY_ANSWERED"


class ChallengeExpiredError(DomainError):
    """Se intentó responder un reto después de `valid_until`."""

    code = "CHALLENGE_EXPIRED"


@dataclass(frozen=True, slots=True)
class Grading:
    """Datos de calificación, ocultos hasta que exista un intento.

    `signal_codes`/`feedback_code` son slugs para métricas de baja cardinalidad;
    `reveal` es el material educativo legible que el cliente recibe recién con
    el resultado del intento.
    """

    decision: MessageKind
    signal_codes: tuple[str, ...]
    feedback_code: str
    reveal: ScenarioReveal


@dataclass(slots=True)
class Challenge:
    challenge_id: str
    scenario_id: str
    scenario_version: int
    app_type: AppType
    difficulty: Difficulty
    message_kind: MessageKind
    payload_snapshot: dict[str, Any]
    grading: Grading
    issued_at: datetime
    valid_until: datetime
    status: ChallengeStatus = field(default=ChallengeStatus.ISSUED)
    answered_at: datetime | None = field(default=None)

    def mark_answered(self, *, answered_at: datetime) -> None:
        if self.status is ChallengeStatus.ANSWERED:
            raise ChallengeAlreadyAnsweredError(self.challenge_id)
        if answered_at > self.valid_until:
            raise ChallengeExpiredError(self.challenge_id)

        self.status = ChallengeStatus.ANSWERED
        self.answered_at = answered_at

    @property
    def allows_conversation(self) -> bool:
        return self.grading.reveal.allows_conversation

    def to_visible_payload(self) -> dict[str, Any]:
        """Representación segura para el cliente: sin `grading` ni decisión."""
        return {
            "challengeId": self.challenge_id,
            "appType": self.app_type.value,
            "difficulty": self.difficulty.value,
            "payload": self.payload_snapshot,
            "validUntil": format_rfc3339(self.valid_until),
        }


def format_rfc3339(value: datetime) -> str:
    """RFC 3339 en UTC con sufijo `Z` y precisión de segundos.

    El resto del API ya usa esta forma (`createdAt`, `decidedAt`); sin esto
    `validUntil` salía con microsegundos y `+00:00`, obligando al cliente a
    entender dos formatos de fecha.
    """

    return value.astimezone(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
