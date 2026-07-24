from fastapi import FastAPI
from fastapi.responses import JSONResponse


def create_ia_app() -> FastAPI:
    app = FastAPI(docs_url=None, redoc_url=None)

    @app.get("/v1/ia/health", response_model=None)
    def health() -> JSONResponse:  # pyright: ignore[reportUnusedFunction]
        return JSONResponse(
            content={"service": "api-ia", "status": "disabled"},
            headers={"Cache-Control": "no-store"},
        )

    return app


app = create_ia_app()
