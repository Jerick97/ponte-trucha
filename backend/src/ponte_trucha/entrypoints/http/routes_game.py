"""Rutas del loop autoritativo: intentos y progreso."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header, Request, Response

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.entrypoints.http.auth import AdultDependency, require_scope
from ponte_trucha.entrypoints.http.composition import UseCases
from ponte_trucha.entrypoints.http.schemas import AttemptResultResponse, SubmitAttemptRequest


def _use_cases(request: Request) -> UseCases:
    use_cases: UseCases = request.app.state.use_cases
    return use_cases


def register_game_routes(*, base_adult_dependency: AdultDependency) -> APIRouter:
    router = APIRouter(tags=["juego"])
    game_play = require_scope(base_adult_dependency, scope="game.play")

    @router.post(
        "/v1/retos/{challenge_id}/intentos",
        response_model=AttemptResultResponse,
    )
    def submit_attempt(  # pyright: ignore[reportUnusedFunction]
        challenge_id: str,
        body: SubmitAttemptRequest,
        response: Response,
        idempotency_key: str = Header(alias="Idempotency-Key", min_length=8, max_length=128),
        adult: AuthenticatedAdult = Depends(game_play),
        use_cases: UseCases = Depends(_use_cases),
    ) -> AttemptResultResponse:
        result, replayed = use_cases.submit_attempt.execute(
            adult,
            challenge_id=challenge_id,
            decision=body.decision,
            response_time_bucket=body.response_time_bucket,
            idempotency_key=idempotency_key,
        )
        response.headers["Idempotency-Replayed"] = str(replayed).lower()
        return AttemptResultResponse(
            attempt_id=result.attempt_id,
            challenge_id=result.challenge_id,
            is_correct=result.is_correct,
            points_awarded=result.points_awarded,
            score=result.score,
            streak=result.streak,
            total_attempts=result.total_attempts,
            correct_attempts=result.correct_attempts,
            current_difficulty=result.current_difficulty,
            signal_codes=result.signal_codes,
            feedback_code=result.feedback_code,
        )

    return router
