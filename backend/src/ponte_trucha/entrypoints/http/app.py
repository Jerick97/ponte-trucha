from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from ponte_trucha.domain.errors import DomainError
from ponte_trucha.entrypoints.http.auth import build_authenticated_adult_dependency
from ponte_trucha.entrypoints.http.composition import build_parent_ref_deriver, build_use_cases
from ponte_trucha.entrypoints.http.problem_details import domain_error_handler
from ponte_trucha.entrypoints.http.routes_account import register_account_routes
from ponte_trucha.entrypoints.http.routes_apps import register_apps_routes
from ponte_trucha.entrypoints.http.routes_profiles import register_profile_routes

PROBLEM_NOT_FOUND = "https://ponte-trucha.pe/problems/not-found"


def _not_found(_: Request, __: Exception) -> JSONResponse:
    return JSONResponse(
        content={
            "detail": "La ruta solicitada no existe.",
            "status": 404,
            "title": "Ruta no encontrada",
            "type": PROBLEM_NOT_FOUND,
        },
        media_type="application/problem+json",
        status_code=404,
    )


def create_app() -> FastAPI:
    app = FastAPI(
        title="Ponte Trucha API",
        version="0.1.0",
        openapi_url="/v1/openapi.json",
        docs_url=None,
        redoc_url=None,
    )
    app.add_exception_handler(404, _not_found)
    app.add_exception_handler(DomainError, domain_error_handler)

    @app.get("/v1/health", response_model=None)
    def health() -> JSONResponse:  # pyright: ignore[reportUnusedFunction]
        payload: dict[str, str] = {
            "service": "api-core",
            "status": "ok",
            "version": "0.1.0",
        }
        return JSONResponse(content=payload, headers={"Cache-Control": "no-store"})

    app.state.use_cases = build_use_cases()

    base_adult_dependency = build_authenticated_adult_dependency(
        parent_ref_deriver=build_parent_ref_deriver()
    )
    app.include_router(register_account_routes(base_adult_dependency=base_adult_dependency))
    app.include_router(register_profile_routes(base_adult_dependency=base_adult_dependency))
    app.include_router(register_apps_routes())

    return app


app = create_app()
