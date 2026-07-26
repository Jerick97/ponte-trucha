"""API IA aislada.

El endpoint es efímero, exige access token + consentimiento `serverSideAi` y
no registra ni persiste el historial. Bedrock sigue apagado por ADR-005.
"""

from __future__ import annotations

from typing import Literal

from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.domain.errors import DomainError
from ponte_trucha.entrypoints.http.auth import (
    AdultDependency,
    build_authenticated_adult_dependency,
    require_scope,
)
from ponte_trucha.entrypoints.http.composition import (
    UseCases,
    build_parent_ref_deriver,
    build_use_cases,
)
from ponte_trucha.entrypoints.http.problem_details import (
    domain_error_handler,
    validation_error_handler,
)


def _camel_case(name: str) -> str:
    first, *rest = name.split("_")
    return first + "".join(part.capitalize() for part in rest)


class _Turn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    autor: Literal["nino", "estafador"]
    texto: str = Field(min_length=1, max_length=200)


class _ConversationRequest(BaseModel):
    model_config = ConfigDict(alias_generator=lambda name: _camel_case(name), extra="forbid")

    challenge_id: str = Field(min_length=1, max_length=80)
    historial: tuple[_Turn, ...] = Field(max_length=8)


class _ConversationResponse(BaseModel):
    texto: str
    origen: Literal["curated"] = "curated"
    filtrada: bool = True


def _use_cases(request: Request) -> UseCases:
    use_cases: UseCases = request.app.state.use_cases
    return use_cases


def _register_conversation_route(app: FastAPI, *, base_adult_dependency: AdultDependency) -> None:
    game_play = require_scope(base_adult_dependency, scope="game.play")

    @app.post(
        "/v1/conversaciones/respuestas",
        response_model=_ConversationResponse,
        tags=["ia"],
    )
    def reply(  # pyright: ignore[reportUnusedFunction]
        body: _ConversationRequest,
        adult: AuthenticatedAdult = Depends(game_play),
        use_cases: UseCases = Depends(_use_cases),
    ) -> _ConversationResponse:
        child_turns = tuple(turn.texto for turn in body.historial if turn.autor == "nino")
        text = use_cases.conversation_reply.execute(
            adult, challenge_id=body.challenge_id, child_turns=child_turns
        )
        return _ConversationResponse(texto=text)


def create_ia_app() -> FastAPI:
    app = FastAPI(
        title="Ponte Trucha API IA",
        version="0.1.0",
        openapi_url="/v1/ia/openapi.json",
        docs_url=None,
        redoc_url=None,
    )
    app.add_exception_handler(DomainError, domain_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.state.use_cases = build_use_cases()
    dependency = build_authenticated_adult_dependency(parent_ref_deriver=build_parent_ref_deriver())
    _register_conversation_route(app, base_adult_dependency=dependency)

    @app.get("/v1/ia/health", response_model=None)
    def health() -> JSONResponse:  # pyright: ignore[reportUnusedFunction]
        return JSONResponse(
            content={"service": "api-ia", "status": "curated-only"},
            headers={"Cache-Control": "no-store"},
        )

    return app


app = create_ia_app()
