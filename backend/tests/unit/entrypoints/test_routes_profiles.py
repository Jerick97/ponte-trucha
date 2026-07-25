from __future__ import annotations

from fastapi.testclient import TestClient

from .http_helpers import new_client, request_context_header


def _onboard_adult(client: TestClient, *, sub: str) -> dict[str, str]:
    headers = request_context_header(sub=sub)
    client.post("/v1/cuenta", json={"ageGateRuleVersion": "age-gate-v1"}, headers=headers)
    client.patch(
        "/v1/consentimientos/core",
        json={"decision": "grant", "policyVersion": "privacy-v1", "method": "explicit-click"},
        headers={**headers, "Idempotency-Key": f"grant-core-{sub}"},
    )
    return headers


def test_create_profile_requires_core_consent() -> None:
    client = new_client()
    headers = request_context_header(sub="sub-1")
    client.post("/v1/cuenta", json={"ageGateRuleVersion": "age-gate-v1"}, headers=headers)

    response = client.post(
        "/v1/perfiles",
        json={"aliasId": "alias-zorro", "avatarId": "avatar-01", "ageBand": "8-10"},
        headers=headers,
    )

    assert response.status_code == 403
    assert response.json()["code"] == "CONSENT_REQUIRED"


def test_create_profile_succeeds_after_core_consent() -> None:
    client = new_client()
    headers = _onboard_adult(client, sub="sub-1")

    response = client.post(
        "/v1/perfiles",
        json={"aliasId": "alias-zorro", "avatarId": "avatar-01", "ageBand": "8-10"},
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["aliasId"] == "alias-zorro"
    assert body["ageBand"] == "8-10"
    assert "childId" in body


def test_create_profile_rejects_alias_outside_catalog() -> None:
    client = new_client()
    headers = _onboard_adult(client, sub="sub-1")

    response = client.post(
        "/v1/perfiles",
        json={"aliasId": "nombre-real-del-nino", "avatarId": "avatar-01", "ageBand": "8-10"},
        headers=headers,
    )

    assert response.status_code == 422
    assert response.json()["code"] == "INVALID_PROFILE_SELECTION"


def test_list_profiles_only_shows_own_active_profiles() -> None:
    client = new_client()
    headers = _onboard_adult(client, sub="sub-1")
    client.post(
        "/v1/perfiles",
        json={"aliasId": "alias-zorro", "avatarId": "avatar-01", "ageBand": "8-10"},
        headers=headers,
    )

    response = client.get("/v1/perfiles", headers=headers)

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_update_and_delete_profile_round_trip() -> None:
    client = new_client()
    headers = _onboard_adult(client, sub="sub-1")
    created = client.post(
        "/v1/perfiles",
        json={"aliasId": "alias-zorro", "avatarId": "avatar-01", "ageBand": "8-10"},
        headers=headers,
    ).json()
    child_id = created["childId"]

    updated = client.patch(
        f"/v1/perfiles/{child_id}",
        json={"aliasId": "alias-colibri", "avatarId": "avatar-02"},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["aliasId"] == "alias-colibri"

    deleted = client.delete(
        f"/v1/perfiles/{child_id}",
        headers={**headers, "Idempotency-Key": "delete-profile-1"},
    )
    assert deleted.status_code == 204

    listed = client.get("/v1/perfiles", headers=headers)
    assert listed.json() == []


def test_adult_b_cannot_read_update_or_delete_adult_a_profile() -> None:
    client = new_client()
    headers_a = _onboard_adult(client, sub="sub-a")
    headers_b = _onboard_adult(client, sub="sub-b")

    created = client.post(
        "/v1/perfiles",
        json={"aliasId": "alias-zorro", "avatarId": "avatar-01", "ageBand": "8-10"},
        headers=headers_a,
    ).json()
    child_id = created["childId"]

    listed_by_b = client.get("/v1/perfiles", headers=headers_b)
    assert listed_by_b.json() == []

    update_by_b = client.patch(
        f"/v1/perfiles/{child_id}",
        json={"aliasId": "alias-colibri", "avatarId": "avatar-02"},
        headers=headers_b,
    )
    assert update_by_b.status_code == 404
    assert update_by_b.json()["code"] == "PROFILE_NOT_FOUND"

    delete_by_b = client.delete(
        f"/v1/perfiles/{child_id}",
        headers={**headers_b, "Idempotency-Key": "delete-profile-b"},
    )
    assert delete_by_b.status_code == 404
    assert delete_by_b.json()["code"] == "PROFILE_NOT_FOUND"


def test_missing_scope_is_rejected_before_touching_use_case() -> None:
    client = new_client()
    headers = request_context_header(sub="sub-1", scopes=("consents.read",))

    response = client.get("/v1/perfiles", headers=headers)

    assert response.status_code == 403
