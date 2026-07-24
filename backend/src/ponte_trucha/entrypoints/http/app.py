from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

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

    @app.get("/v1/health", response_model=None)
    def health() -> JSONResponse:  # pyright: ignore[reportUnusedFunction]
        payload: dict[str, str] = {
            "service": "api-core",
            "status": "ok",
            "version": "0.1.0",
        }
        return JSONResponse(content=payload, headers={"Cache-Control": "no-store"})

    return app


app = create_app()
