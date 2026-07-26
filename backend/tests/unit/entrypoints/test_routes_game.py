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
        headers={**headers, "Idempotency-Key": f"consent-{sub}"},
    )
    created = client.post(
        "/v1/perfiles",
        json={"aliasId": "zorro-listo", "avatarId": "zorro", "ageBand": "8-10"},
        headers=headers,
    ).json()
    return headers, created["childId"]


def test_attempt_updates_progress_and_replays_the_same_result() -> None:
    client = new_client()
    headers, child_id = _onboard_child(client, sub="sub-1")
    challenge = client.get(f"/v1/perfiles/{child_id}/retos/siguiente", headers=headers).json()

    first = client.post(
        f"/v1/retos/{challenge['challengeId']}/intentos",
        json={"decision": "trap", "responseTimeBucket": "under-10s"},
        headers={**headers, "Idempotency-Key": "attempt-key-1"},
    )
    replay = client.post(
        f"/v1/retos/{challenge['challengeId']}/intentos",
        json={"decision": "trap", "responseTimeBucket": "under-10s"},
        headers={**headers, "Idempotency-Key": "attempt-key-1"},
    )
    progress = client.get(f"/v1/perfiles/{child_id}/progreso", headers=headers)

    assert first.status_code == 200
    assert replay.status_code == 200
    assert first.json() == replay.json()
    assert replay.headers["Idempotency-Replayed"] == "true"
    expected_points = 100 if first.json()["isCorrect"] else 0
    assert first.json()["pointsAwarded"] == expected_points
    assert progress.json()["score"] == expected_points
    assert progress.json()["totalAttempts"] == 1


def test_answered_challenge_rejects_a_second_idempotency_key() -> None:
    client = new_client()
    headers, child_id = _onboard_child(client, sub="sub-1")
    challenge_id = client.get(f"/v1/perfiles/{child_id}/retos/siguiente", headers=headers).json()[
        "challengeId"
    ]
    payload = {"decision": "trap", "responseTimeBucket": "under-10s"}

    client.post(
        f"/v1/retos/{challenge_id}/intentos",
        json=payload,
        headers={**headers, "Idempotency-Key": "attempt-key-1"},
    )
    response = client.post(
        f"/v1/retos/{challenge_id}/intentos",
        json=payload,
        headers={**headers, "Idempotency-Key": "attempt-key-2"},
    )

    assert response.status_code == 409
    assert response.json()["code"] == "CHALLENGE_ALREADY_ANSWERED"


def test_adult_cannot_answer_another_adults_challenge() -> None:
    client = new_client()
    headers_a, child_a = _onboard_child(client, sub="sub-a")
    headers_b, _child_b = _onboard_child(client, sub="sub-b")
    challenge_id = client.get(f"/v1/perfiles/{child_a}/retos/siguiente", headers=headers_a).json()[
        "challengeId"
    ]

    response = client.post(
        f"/v1/retos/{challenge_id}/intentos",
        json={"decision": "trap", "responseTimeBucket": "under-10s"},
        headers={**headers_b, "Idempotency-Key": "attempt-key-b"},
    )

    assert response.status_code == 404
    assert response.json()["code"] == "CHALLENGE_NOT_FOUND"


def test_revoked_core_consent_stops_new_challenges() -> None:
    client = new_client()
    headers, child_id = _onboard_child(client, sub="sub-1")
    client.patch(
        "/v1/consentimientos/core",
        json={"decision": "revoke", "policyVersion": "politica-2026-07-v1", "method": "settings"},
        headers={**headers, "Idempotency-Key": "revoke-core"},
    )

    response = client.get(f"/v1/perfiles/{child_id}/retos/siguiente", headers=headers)

    assert response.status_code == 403
    assert response.json()["code"] == "CONSENT_REQUIRED"
