"""Entidad `Challenge`: un reto emitido a un perfil infantil.

Refleja el modelo lógico de ADR-003. `payload_snapshot` es lo único visible
para el cliente; `grading` (decisión correcta, señales y feedback) nunca se
serializa hacia afuera antes del intento.

Sin dependencias externas: dominio puro.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from typing import Any

from ponte_trucha.domain.channels import AppType
from ponte_trucha.domain.value_objects import Difficulty


class ChallengeStatus(StrEnum):
    ISSUED = "issued"
    ANSWERED = "answered"
    EXPIRED = "expired"


class MessageKind(StrEnum):
    TRAP = "trap"
    LEGITIMATE = "legitimate"


class ChallengeAlreadyAnsweredError(Exception):
    """Se intentó responder un reto que ya tiene un intento calificado."""


class ChallengeExpiredError(Exception):
    """Se intentó responder un reto después de `valid_until`."""


@dataclass(frozen=True, slots=True)
class Grading:
    """Datos de calificación, ocultos hasta que exista un intento."""

    decision: MessageKind
    signal_codes: tuple[str, ...]
    feedback_code: str


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

    def to_visible_payload(self) -> dict[str, Any]:
        """Representación segura para el cliente: sin `grading` ni decisión."""
        return {
            "challengeId": self.challenge_id,
            "appType": self.app_type.value,
            "difficulty": self.difficulty.value,
            "payload": self.payload_snapshot,
            "validUntil": self.valid_until.isoformat(),
        }
