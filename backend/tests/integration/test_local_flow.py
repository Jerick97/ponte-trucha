"""Flujo completo del API sobre el gateway local de desarrollo.

Estas pruebas ejercitan el mismo FastAPI de producción a través del puente
local (`backend/scripts/dev_server.py`), que reemplaza al JWT authorizer de API
Gateway durante el desarrollo. Cubren el camino que un tester recorre a mano:
cuenta → consentimiento → perfil → reto → intento → progreso → borrado, más los
casos de seguridad que no deben regresar (401, 403 por scope, IDOR y suplantación
del header de contexto).

No usan AWS ni Floci: la composición cae a repositories en memoria cuando
`DOMAIN_TABLE_NAME` no está definido.
"""

from __future__ import annotations

from pathlib import Path

import pytest
from dev_server import (
    LOCAL_AUTH_TOKEN_PREFIX,
    PERSISTENT_MODE_ENV_VARS,
    build_local_app,
    local_dev_token,
)
from fastapi.testclient import TestClient

ALLOWED_ORIGIN = "http://localhost:5173"
GRADING_FIELDS = ("respuestaCorrecta", "senales", "leccion", "perfilEstafador", "tipo")


def _client() -> TestClient:
    """Cliente nuevo por prueba: la memoria del proceso queda aislada."""

    return TestClient(build_local_app())


def _auth(sub: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {local_dev_token(sub)}"}


def _onboard(client: TestClient, *, sub: str, purposes: tuple[str, ...] = ("core",)) -> str:
    headers = _auth(sub)
    client.post("/v1/cuenta", json={"ageGateRuleVersion": "age-gate-v1"}, headers=headers)
    for purpose in purposes:
        client.patch(
            f"/v1/consentimientos/{purpose}",
            json={
                "decision": "grant",
                "policyVersion": "politica-2026-07-v1",
                "method": "explicit-click",
            },
            headers={**headers, "Idempotency-Key": f"consent-{sub}-{purpose}"},
        )
    created = client.post(
        "/v1/perfiles",
        json={"aliasId": "zorro-listo", "avatarId": "zorro", "ageBand": "8-10"},
        headers=headers,
    )
    assert created.status_code == 201
    child_id: str = created.json()["childId"]
    return child_id


def test_health_needs_no_token() -> None:
    client = _client()

    core = client.get("/v1/health")
    ia = client.get("/v1/ia/health")

    assert core.status_code == 200
    assert core.json()["service"] == "api-core"
    assert ia.status_code == 200
    assert ia.json()["service"] == "api-ia"


def test_protected_route_without_token_is_unauthorized() -> None:
    response = _client().get("/v1/me")

    assert response.status_code == 401


def test_client_cannot_forge_the_request_context_header() -> None:
    """El puente descarta el header de API Gateway que envíe el cliente."""

    forged = '{"authorizer":{"jwt":{"claims":{"sub":"intruso","scope":"profiles.read"}}}}'

    response = _client().get("/v1/me", headers={"x-amzn-request-context": forged})

    assert response.status_code == 401


def test_token_without_scope_is_forbidden() -> None:
    client = _client()
    headers = {**_auth("sub-1"), "X-Dev-Scopes": "profiles.read"}
    client.post("/v1/cuenta", json={"ageGateRuleVersion": "age-gate-v1"}, headers=headers)

    response = client.get("/v1/consentimientos", headers=headers)

    assert response.status_code == 403


def test_full_local_flow_from_account_to_progress() -> None:
    client = _client()
    headers = _auth("sub-1")
    child_id = _onboard(client, sub="sub-1")

    challenge = client.get(f"/v1/perfiles/{child_id}/retos/siguiente", headers=headers)
    assert challenge.status_code == 200
    body = challenge.json()
    assert set(body) == {"challengeId", "appType", "difficulty", "payload", "validUntil"}
    for field in GRADING_FIELDS:
        assert field not in body["payload"]

    attempt = client.post(
        f"/v1/retos/{body['challengeId']}/intentos",
        json={"decision": "trap", "responseTimeBucket": "under-10s"},
        headers={**headers, "Idempotency-Key": "intento-local-1"},
    )
    replay = client.post(
        f"/v1/retos/{body['challengeId']}/intentos",
        json={"decision": "trap", "responseTimeBucket": "under-10s"},
        headers={**headers, "Idempotency-Key": "intento-local-1"},
    )
    progress = client.get(f"/v1/perfiles/{child_id}/progreso", headers=headers)

    assert attempt.status_code == 200
    assert attempt.headers["Idempotency-Replayed"] == "false"
    assert replay.headers["Idempotency-Replayed"] == "true"
    assert attempt.json() == replay.json()
    assert progress.json()["totalAttempts"] == 1
    assert progress.json()["score"] == attempt.json()["pointsAwarded"]


def test_another_adult_cannot_read_a_foreign_profile() -> None:
    client = _client()
    child_id = _onboard(client, sub="sub-a")
    _onboard(client, sub="sub-b")

    response = client.get(f"/v1/perfiles/{child_id}", headers=_auth("sub-b"))

    assert response.status_code == 404
    assert response.json()["code"] == "PROFILE_NOT_FOUND"


def _answer_until_conversation(client: TestClient, *, sub: str, child_id: str) -> str:
    """Responde retos hasta encontrar uno que admita chat, y devuelve su id."""

    headers = _auth(sub)
    for attempt_number in range(1, 12):
        challenge = client.get(f"/v1/perfiles/{child_id}/retos/siguiente", headers=headers).json()
        result = client.post(
            f"/v1/retos/{challenge['challengeId']}/intentos",
            json={"decision": "trap", "responseTimeBucket": "under-10s"},
            headers={**headers, "Idempotency-Key": f"intento-chat-{sub}-{attempt_number}"},
        ).json()
        if result["allowsConversation"]:
            return str(challenge["challengeId"])
    raise AssertionError("El banco curado debe tener un escenario con conversación.")


def test_conversation_requires_server_side_ai_consent() -> None:
    client = _client()
    child_denied = _onboard(client, sub="sub-1")
    challenge_denied = _answer_until_conversation(client, sub="sub-1", child_id=child_denied)

    denied = client.post(
        "/v1/conversaciones/respuestas",
        json={"challengeId": challenge_denied, "historial": []},
        headers=_auth("sub-1"),
    )

    child_granted = _onboard(client, sub="sub-2", purposes=("core", "serverSideAi"))
    challenge_granted = _answer_until_conversation(client, sub="sub-2", child_id=child_granted)
    granted = client.post(
        "/v1/conversaciones/respuestas",
        json={
            "challengeId": challenge_granted,
            "historial": [{"autor": "nino", "texto": "dale, cuéntame"}],
        },
        headers=_auth("sub-2"),
    )

    assert denied.status_code == 403
    assert denied.json()["code"] == "CONSENT_REQUIRED"
    assert granted.status_code == 200
    assert granted.json()["origen"] == "curated"
    assert granted.json()["texto"]


def test_conversation_rejects_a_foreign_challenge() -> None:
    client = _client()
    child_a = _onboard(client, sub="sub-a", purposes=("core", "serverSideAi"))
    challenge_a = _answer_until_conversation(client, sub="sub-a", child_id=child_a)
    _onboard(client, sub="sub-b", purposes=("core", "serverSideAi"))

    response = client.post(
        "/v1/conversaciones/respuestas",
        json={"challengeId": challenge_a, "historial": []},
        headers=_auth("sub-b"),
    )

    assert response.status_code == 404
    assert response.json()["code"] == "CHALLENGE_NOT_FOUND"


def test_attempt_reveals_signals_and_lesson_only_after_answering() -> None:
    client = _client()
    headers = _auth("sub-1")
    child_id = _onboard(client, sub="sub-1")

    challenge = client.get(f"/v1/perfiles/{child_id}/retos/siguiente", headers=headers).json()
    result = client.post(
        f"/v1/retos/{challenge['challengeId']}/intentos",
        json={"decision": "trap", "responseTimeBucket": "under-10s"},
        headers={**headers, "Idempotency-Key": "intento-revelacion-1"},
    ).json()

    assert result["correctDecision"] in {"trap", "legitimate"}
    assert result["scenarioType"]
    assert result["lesson"]
    assert all(signal["fragment"] and signal["explanation"] for signal in result["signals"])
    assert isinstance(result["allowsConversation"], bool)


def test_validation_errors_use_problem_json_without_echoing_input() -> None:
    client = _client()
    headers = _auth("sub-1")
    child_id = _onboard(client, sub="sub-1")
    challenge = client.get(f"/v1/perfiles/{child_id}/retos/siguiente", headers=headers).json()

    response = client.post(
        f"/v1/retos/{challenge['challengeId']}/intentos",
        json={"decision": "trap", "responseTimeBucket": "under-10s"},
        headers={**headers, "Idempotency-Key": "corta"},
    )

    assert response.status_code == 422
    assert response.headers["content-type"].startswith("application/problem+json")
    assert response.json()["code"] == "VALIDATION_ERROR"
    assert "corta" not in response.text


def test_account_deletion_clears_the_local_state() -> None:
    client = _client()
    headers = _auth("sub-1")
    _onboard(client, sub="sub-1")

    deleted = client.delete("/v1/me", headers={**headers, "Idempotency-Key": "borrado-local-1"})
    after = client.get("/v1/me", headers=headers)

    assert deleted.status_code == 204
    assert after.status_code == 404


def test_cors_allows_the_vite_dev_origin_only() -> None:
    client = _client()

    allowed = client.options(
        "/v1/me",
        headers={
            "Origin": ALLOWED_ORIGIN,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
        },
    )
    foreign = client.get("/v1/health", headers={"Origin": "https://atacante.example"})

    assert allowed.status_code == 200
    assert allowed.headers["access-control-allow-origin"] == ALLOWED_ORIGIN
    assert "access-control-allow-origin" not in foreign.headers


@pytest.mark.parametrize("variable", PERSISTENT_MODE_ENV_VARS)
def test_local_gateway_refuses_persistent_or_lambda_mode(
    monkeypatch: pytest.MonkeyPatch, variable: str
) -> None:
    monkeypatch.setenv(variable, "algun-valor")

    with pytest.raises(RuntimeError):
        build_local_app()


def test_production_package_does_not_contain_the_auth_shim() -> None:
    """El atajo de auth vive fuera de `src/`, así nunca entra al zip de Lambda."""

    source_root = Path(__file__).parents[2] / "src" / "ponte_trucha"
    sources = source_root.rglob("*.py")

    offenders = [
        path.name for path in sources if LOCAL_AUTH_TOKEN_PREFIX in path.read_text(encoding="utf-8")
    ]

    assert offenders == []
