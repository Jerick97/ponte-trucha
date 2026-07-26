from __future__ import annotations

from fastapi.testclient import TestClient

from .http_helpers import new_client, request_context_header


def _onboard_child(client: TestClient, *, sub: str) -> tuple[dict[str, str], str]:
    headers = request_context_header(sub=sub)
    client.post("/v1/cuenta", json={"ageGateRuleVersion": "age-gate-v1"}, headers=headers)
    client.patch(
        "/v1/consentimientos/core",
        json={
            "decision": "grant",
            "policyVersion": "politica-2026-07-v1",
            "method": "explicit-click",
        },
        headers={**headers, "Idempotency-Key": f"grant-core-{sub}"},
    )
    created = client.post(
        "/v1/perfiles",
        json={"aliasId": "zorro-listo", "avatarId": "zorro", "ageBand": "8-10"},
        headers=headers,
    ).json()
    return headers, created["childId"]


def test_next_challenge_never_exposes_grading_fields() -> None:
    client = new_client()
    headers, child_id = _onboard_child(client, sub="sub-1")

    response = client.get(f"/v1/perfiles/{child_id}/retos/siguiente", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"challengeId", "appType", "difficulty", "payload", "validUntil"}
    assert "respuestaCorrecta" not in body["payload"]
    assert "tipo" not in body["payload"]
    assert "senales" not in body["payload"]
    assert "leccion" not in body["payload"]


def test_next_challenge_requires_game_play_scope() -> None:
    client = new_client()
    _headers, child_id = _onboard_child(client, sub="sub-1")
    limited_headers = request_context_header(sub="sub-1", scopes=("profiles.read",))

    response = client.get(f"/v1/perfiles/{child_id}/retos/siguiente", headers=limited_headers)

    assert response.status_code == 403


def test_next_challenge_for_a_profile_owned_by_another_adult_returns_not_found() -> None:
    client = new_client()
    _headers_a, child_id = _onboard_child(client, sub="sub-a")
    headers_b, _child_b = _onboard_child(client, sub="sub-b")

    response = client.get(f"/v1/perfiles/{child_id}/retos/siguiente", headers=headers_b)

    assert response.status_code == 404
    assert response.json()["code"] == "PROFILE_NOT_FOUND"
