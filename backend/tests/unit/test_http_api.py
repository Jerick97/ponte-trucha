from fastapi.testclient import TestClient

from ponte_trucha.entrypoints.http.api_ia_app import create_ia_app
from ponte_trucha.entrypoints.http.app import create_app


def test_health_exposes_only_safe_operational_fields() -> None:
    response = TestClient(create_app()).get("/v1/health")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    assert response.json() == {
        "service": "api-core",
        "status": "ok",
        "version": "0.1.0",
    }


def test_unknown_route_uses_problem_details_without_internal_detail() -> None:
    response = TestClient(create_app()).get("/v1/no-existe")

    assert response.status_code == 404
    assert response.headers["content-type"].startswith("application/problem+json")
    assert response.json() == {
        "detail": "La ruta solicitada no existe.",
        "status": 404,
        "title": "Ruta no encontrada",
        "type": "https://ponte-trucha.pe/problems/not-found",
    }


def test_ia_lambda_starts_disabled_without_exposing_generation() -> None:
    response = TestClient(create_ia_app()).get("/v1/ia/health")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    assert response.json() == {"service": "api-ia", "status": "disabled"}
