"""Caso de uso autoritativo para responder un reto una sola vez."""

from __future__ import annotations

import hashlib
from collections.abc import Mapping
from dataclasses import dataclass
from datetime import datetime
from typing import cast

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.idempotency import IdempotencyStore, execute_idempotently
from ponte_trucha.application.policy import CURRENT_PRIVACY_POLICY_VERSION
from ponte_trucha.application.ports import (
    AttemptRepository,
    ChallengeRepository,
    ChildProfileRepository,
    Clock,
    ConsentRepository,
    IdGenerator,
    ParentAccountRepository,
    ProgressRepository,
)
from ponte_trucha.domain.attempt import Attempt, ResponseTimeBucket, calculate_points
from ponte_trucha.domain.challenge import MessageKind
from ponte_trucha.domain.errors import (
    AccountNotFoundError,
    ChallengeNotFoundError,
    ConsentRequiredError,
    ProfileNotFoundError,
)
from ponte_trucha.domain.value_objects import ConsentPurpose


@dataclass(frozen=True, slots=True)
class AttemptResult:
    attempt_id: str
    challenge_id: str
    is_correct: bool
    points_awarded: int
    score: int
    streak: int
    total_attempts: int
    correct_attempts: int
    current_difficulty: int
    signal_codes: tuple[str, ...]
    feedback_code: str

    def to_snapshot(self) -> dict[str, object]:
        return {
            "attemptId": self.attempt_id,
            "challengeId": self.challenge_id,
            "isCorrect": self.is_correct,
            "pointsAwarded": self.points_awarded,
            "score": self.score,
            "streak": self.streak,
            "totalAttempts": self.total_attempts,
            "correctAttempts": self.correct_attempts,
            "currentDifficulty": self.current_difficulty,
            "signalCodes": list(self.signal_codes),
            "feedbackCode": self.feedback_code,
        }

    @classmethod
    def from_snapshot(cls, snapshot: Mapping[str, object]) -> AttemptResult:
        raw_signal_codes = snapshot["signalCodes"]
        if not isinstance(raw_signal_codes, list):
            raise ValueError("Snapshot de intento inválido.")
        signal_codes = cast("list[object]", raw_signal_codes)
        return cls(
            attempt_id=str(snapshot["attemptId"]),
            challenge_id=str(snapshot["challengeId"]),
            is_correct=bool(snapshot["isCorrect"]),
            points_awarded=int(snapshot["pointsAwarded"]),  # type: ignore[arg-type]
            score=int(snapshot["score"]),  # type: ignore[arg-type]
            streak=int(snapshot["streak"]),  # type: ignore[arg-type]
            total_attempts=int(snapshot["totalAttempts"]),  # type: ignore[arg-type]
            correct_attempts=int(snapshot["correctAttempts"]),  # type: ignore[arg-type]
            current_difficulty=int(snapshot["currentDifficulty"]),  # type: ignore[arg-type]
            signal_codes=tuple(str(code) for code in signal_codes),
            feedback_code=str(snapshot["feedbackCode"]),
        )


@dataclass(frozen=True, slots=True)
class SubmitAttempt:
    accounts: ParentAccountRepository
    consents: ConsentRepository
    profiles: ChildProfileRepository
    challenges: ChallengeRepository
    attempts: AttemptRepository
    progresses: ProgressRepository
    idempotency: IdempotencyStore
    ids: IdGenerator
    clock: Clock

    def execute(
        self,
        adult: AuthenticatedAdult,
        *,
        challenge_id: str,
        decision: MessageKind,
        response_time_bucket: ResponseTimeBucket,
        idempotency_key: str,
    ) -> tuple[AttemptResult, bool]:
        child_id = self.challenges.locate_child(
            parent_ref=adult.parent_ref, challenge_id=challenge_id
        )
        if child_id is None:
            raise ChallengeNotFoundError("El reto no existe o no pertenece a este adulto.")

        request_hash = hashlib.sha256(
            f"{decision.value}|{response_time_bucket.value}".encode()
        ).hexdigest()

        snapshot, replayed = execute_idempotently(
            self.idempotency,
            parent_ref=adult.parent_ref,
            scope_key=f"CHILD#{child_id}",
            operation=f"SubmitAttempt#{challenge_id}",
            idempotency_key=idempotency_key,
            request_hash=request_hash,
            now=self.clock.now(),
            run=lambda: self._grade(
                adult=adult,
                child_id=child_id,
                challenge_id=challenge_id,
                decision=decision,
                response_time_bucket=response_time_bucket,
            ).to_snapshot(),
        )
        return AttemptResult.from_snapshot(snapshot), replayed

    def _grade(
        self,
        *,
        adult: AuthenticatedAdult,
        child_id: str,
        challenge_id: str,
        decision: MessageKind,
        response_time_bucket: ResponseTimeBucket,
    ) -> AttemptResult:
        account = self.accounts.get(parent_ref=adult.parent_ref)
        if account is None:
            raise AccountNotFoundError()
        account.require_active()

        profile = self.profiles.get(parent_ref=adult.parent_ref, child_id=child_id)
        if profile is None or not profile.is_active:
            raise ProfileNotFoundError()

        consent = self.consents.get(parent_ref=adult.parent_ref, purpose=ConsentPurpose.CORE)
        if consent is None or not consent.is_active_for(CURRENT_PRIVACY_POLICY_VERSION):
            raise ConsentRequiredError()

        challenge = self.challenges.get(child_id=child_id, challenge_id=challenge_id)
        if challenge is None:
            raise ChallengeNotFoundError()

        answered_at = datetime.fromisoformat(self.clock.now().replace("Z", "+00:00"))
        challenge.mark_answered(answered_at=answered_at)
        progress = self.progresses.get(child_id=child_id)
        is_correct = decision is challenge.grading.decision
        points = calculate_points(is_correct=is_correct, previous_streak=progress.streak)
        updated_progress = progress.record_attempt(
            scenario_id=challenge.scenario_id,
            message_kind=challenge.message_kind,
            is_correct=is_correct,
            points=points,
        )
        attempt = Attempt(
            attempt_id=self.ids.new_id(prefix="attempt"),
            challenge_id=challenge.challenge_id,
            scenario_id=challenge.scenario_id,
            app_type=challenge.app_type,
            difficulty=challenge.difficulty,
            decision=decision,
            is_correct=is_correct,
            points_awarded=points,
            feedback_code=challenge.grading.feedback_code,
            response_time_bucket=response_time_bucket,
            answered_at=answered_at,
        )

        self.challenges.save(child_id=child_id, challenge=challenge)
        self.attempts.create(child_id=child_id, attempt=attempt)
        self.progresses.save(child_id=child_id, progress=updated_progress)

        return AttemptResult(
            attempt_id=attempt.attempt_id,
            challenge_id=attempt.challenge_id,
            is_correct=is_correct,
            points_awarded=points,
            score=updated_progress.score,
            streak=updated_progress.streak,
            total_attempts=updated_progress.total_attempts,
            correct_attempts=updated_progress.correct_attempts,
            current_difficulty=updated_progress.current_difficulty.value,
            signal_codes=challenge.grading.signal_codes,
            feedback_code=challenge.grading.feedback_code,
        )
