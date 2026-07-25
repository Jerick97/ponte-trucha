"""Helpers compartidos para tests HTTP de cuenta/consentimiento/perfiles."""

from __future__ import annotations

import json

from fastapi.testclient import TestClient

from ponte_trucha.entrypoints.http.app import create_app

REQUEST_CONTEXT_HEADER = "x-amzn-request-context"

ALL_SCOPES = (
    "profiles.read",
    "profiles.write",
    "consents.read",
    "consents.write",
    "game.play",
    "account.delete",
)


def request_context_header(*, sub: str, scopes: tuple[str, ...] = ALL_SCOPES) -> dict[str, str]:
    """Simula el header que AWS Lambda Web Adapter reenvía desde API Gateway.

    Ver https://aws.github.io/aws-lambda-web-adapter/features/request-context.html.
    API Gateway ya validó firma, issuer, audiencia y scopes antes de invocar
    Lambda; este helper solo reproduce la forma del contexto reenviado.
    """

    payload = {
        "authorizer": {
            "jwt": {
                "claims": {"sub": sub, "scope": " ".join(scopes)},
                "scopes": list(scopes),
            }
        }
    }
    return {REQUEST_CONTEXT_HEADER: json.dumps(payload)}


def new_client() -> TestClient:
    """Un cliente con una app nueva (estado en memoria aislado por test)."""

    return TestClient(create_app())
