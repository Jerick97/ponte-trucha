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
    child = client.post(
        "/v1/perfiles",
        json={"aliasId": "zorro-listo", "avatarId": "zorro", "ageBand": "8-10"},
        headers=headers,
    ).json()
    return headers, child["childId"]


def test_get_me_and_get_profile_return_only_owned_minimal_data() -> None:
    client = new_client()
    headers, child_id = _onboard_child(client, sub="sub-1")

    account = client.get("/v1/me", headers=headers)
    profile = client.get(f"/v1/perfiles/{child_id}", headers=headers)

    assert account.status_code == 200
    assert set(account.json()) == {
        "status",
        "ageGateRuleVersion",
        "profileCount",
        "createdAt",
        "updatedAt",
    }
    assert profile.status_code == 200
    assert profile.json()["childId"] == child_id
    assert "name" not in profile.json()
    assert "email" not in profile.json()


def test_delete_account_removes_profiles_and_is_idempotent() -> None:
    client = new_client()
    headers, _child_id = _onboard_child(client, sub="sub-1")
    delete_headers = {**headers, "Idempotency-Key": "delete-account-1"}

    first = client.delete("/v1/me", headers=delete_headers)
    replay = client.delete("/v1/me", headers=delete_headers)
    after = client.get("/v1/me", headers=headers)

    assert first.status_code == 204
    assert replay.status_code == 204
    assert replay.headers["Idempotency-Replayed"] == "true"
    assert after.status_code == 404
