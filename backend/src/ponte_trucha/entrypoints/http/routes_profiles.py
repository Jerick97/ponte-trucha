"""Rutas de perfiles infantiles (R4)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header, Request, Response, status

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.create_child_profile import CreateChildProfileCommand
from ponte_trucha.application.update_child_profile import UpdateChildProfileCommand
from ponte_trucha.entrypoints.http.auth import AdultDependency, require_scope
from ponte_trucha.entrypoints.http.composition import UseCases
from ponte_trucha.entrypoints.http.schemas import (
    ChildProfileResponse,
    CreateChildProfileRequest,
    NextChallengeResponse,
    ProgressResponse,
    UpdateChildProfileRequest,
)


def _use_cases(request: Request) -> UseCases:
    use_cases: UseCases = request.app.state.use_cases
    return use_cases


def register_profile_routes(*, base_adult_dependency: AdultDependency) -> APIRouter:
    router = APIRouter(tags=["perfiles"])
    profiles_read = require_scope(base_adult_dependency, scope="profiles.read")
    profiles_write = require_scope(base_adult_dependency, scope="profiles.write")
    game_play = require_scope(base_adult_dependency, scope="game.play")

    @router.get("/v1/perfiles", response_model=list[ChildProfileResponse])
    def list_profiles(  # pyright: ignore[reportUnusedFunction]
        adult: AuthenticatedAdult = Depends(profiles_read),
        use_cases: UseCases = Depends(_use_cases),
    ) -> list[ChildProfileResponse]:
        profiles = use_cases.list_child_profiles.execute(adult)
        return [ChildProfileResponse.from_domain(profile) for profile in profiles]

    @router.get("/v1/perfiles/{child_id}", response_model=ChildProfileResponse)
    def get_profile(  # pyright: ignore[reportUnusedFunction]
        child_id: str,
        adult: AuthenticatedAdult = Depends(profiles_read),
        use_cases: UseCases = Depends(_use_cases),
    ) -> ChildProfileResponse:
        profile = use_cases.get_child_profile.execute(adult, child_id=child_id)
        return ChildProfileResponse.from_domain(profile)

    @router.post(
        "/v1/perfiles", response_model=ChildProfileResponse, status_code=status.HTTP_201_CREATED
    )
    def create_profile(  # pyright: ignore[reportUnusedFunction]
        body: CreateChildProfileRequest,
        adult: AuthenticatedAdult = Depends(profiles_write),
        use_cases: UseCases = Depends(_use_cases),
    ) -> ChildProfileResponse:
        command = CreateChildProfileCommand(
            alias_id=body.alias_id, avatar_id=body.avatar_id, age_band=body.age_band
        )
        profile = use_cases.create_child_profile.execute(adult, command)
        return ChildProfileResponse.from_domain(profile)

    @router.patch("/v1/perfiles/{child_id}", response_model=ChildProfileResponse)
    def update_profile(  # pyright: ignore[reportUnusedFunction]
        child_id: str,
        body: UpdateChildProfileRequest,
        adult: AuthenticatedAdult = Depends(profiles_write),
        use_cases: UseCases = Depends(_use_cases),
    ) -> ChildProfileResponse:
        command = UpdateChildProfileCommand(
            child_id=child_id, alias_id=body.alias_id, avatar_id=body.avatar_id
        )
        profile = use_cases.update_child_profile.execute(adult, command)
        return ChildProfileResponse.from_domain(profile)

    @router.delete("/v1/perfiles/{child_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_profile(  # pyright: ignore[reportUnusedFunction]
        child_id: str,
        response: Response,
        idempotency_key: str = Header(alias="Idempotency-Key", min_length=8, max_length=128),
        adult: AuthenticatedAdult = Depends(profiles_write),
        use_cases: UseCases = Depends(_use_cases),
    ) -> None:
        _deleted, replayed = use_cases.delete_child_profile.execute(
            adult, child_id=child_id, idempotency_key=idempotency_key
        )
        response.headers["Idempotency-Replayed"] = str(replayed).lower()

    @router.get(
        "/v1/perfiles/{child_id}/progreso",
        response_model=ProgressResponse,
    )
    def get_progress(  # pyright: ignore[reportUnusedFunction]
        child_id: str,
        adult: AuthenticatedAdult = Depends(profiles_read),
        use_cases: UseCases = Depends(_use_cases),
    ) -> ProgressResponse:
        progress = use_cases.get_progress.execute(adult, child_id=child_id)
        return ProgressResponse.from_domain(progress)

    @router.get(
        "/v1/perfiles/{child_id}/retos/siguiente",
        response_model=NextChallengeResponse,
    )
    def issue_next_challenge(  # pyright: ignore[reportUnusedFunction]
        child_id: str,
        adult: AuthenticatedAdult = Depends(game_play),
        use_cases: UseCases = Depends(_use_cases),
    ) -> NextChallengeResponse:
        challenge = use_cases.issue_next_challenge.execute(adult, child_id=child_id)
        return NextChallengeResponse.from_domain(challenge)

    return router
