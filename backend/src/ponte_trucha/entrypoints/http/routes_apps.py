"""Catálogo público de apps/canales (R3, `design.md` #catálogo-de-apps).

Sin access token, igual que `/v1/health`: no expone datos de cuenta, perfil,
progreso ni escenario. Solo la metadata de `list_channels()`.
"""

from __future__ import annotations

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from ponte_trucha.entrypoints.http.composition import UseCases
from ponte_trucha.entrypoints.http.schemas import ChannelResponse

_CACHE_CONTROL = "public, max-age=300"


def _use_cases(request: Request) -> UseCases:
    use_cases: UseCases = request.app.state.use_cases
    return use_cases


def register_apps_routes() -> APIRouter:
    router = APIRouter(tags=["apps"])

    @router.get("/v1/apps", response_model=list[ChannelResponse])
    def list_apps(request: Request) -> JSONResponse:  # pyright: ignore[reportUnusedFunction]
        channels = _use_cases(request).channel_registry.list_channels()
        body = [
            ChannelResponse.from_domain(channel).model_dump(by_alias=True) for channel in channels
        ]
        return JSONResponse(content=body, headers={"Cache-Control": _CACHE_CONTROL})

    return router
