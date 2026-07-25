from __future__ import annotations

from ponte_trucha.entrypoints.http.auth import REQUEST_CONTEXT_HEADER

from .http_helpers import new_client, request_context_header


def test_missing_request_context_header_is_rejected_with_401() -> None:
    client = new_client()

    response = client.post("/v1/cuenta", json={"ageGateRuleVersion": "age-gate-v1"})

    assert response.status_code == 401


def test_bootstrap_account_creates_account_with_default_denied_consents() -> None:
    client = new_client()
    headers = request_context_header(sub="sub-1")

    response = client.post(
        "/v1/cuenta", json={"ageGateRuleVersion": "age-gate-v1"}, headers=headers
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "active"
    assert body["profileCount"] == 0


def test_bootstrap_account_is_idempotent_on_profile_count() -> None:
    client = new_client()
    headers = request_context_header(sub="sub-1")

    client.post("/v1/cuenta", json={"ageGateRuleVersion": "age-gate-v1"}, headers=headers)
    second = client.post("/v1/cuenta", json={"ageGateRuleVersion": "age-gate-v1"}, headers=headers)

    assert second.status_code == 200
    assert second.json()["profileCount"] == 0


def test_get_consents_requires_consents_read_scope() -> None:
    client = new_client()
    headers = request_context_header(sub="sub-1", scopes=("profiles.read",))
    client.post(
        "/v1/cuenta",
        json={"ageGateRuleVersion": "age-gate-v1"},
        headers=request_context_header(sub="sub-1"),
    )

    response = client.get("/v1/consentimientos", headers=headers)

    assert response.status_code == 403


def test_get_consents_lists_all_purposes_denied_by_default() -> None:
    client = new_client()
    headers = request_context_header(sub="sub-1")
    client.post("/v1/cuenta", json={"ageGateRuleVersion": "age-gate-v1"}, headers=headers)

    response = client.get("/v1/consentimientos", headers=headers)

    assert response.status_code == 200
    purposes = {record["purpose"] for record in response.json()}
    assert purposes == {"core", "serverSideAi", "productAnalytics"}
    assert all(record["state"] == "denied" for record in response.json())


def test_update_consent_grants_core_purpose() -> None:
    client = new_client()
    headers = request_context_header(sub="sub-1")
    client.post("/v1/cuenta", json={"ageGateRuleVersion": "age-gate-v1"}, headers=headers)

    response = client.patch(
        "/v1/consentimientos/core",
        json={"decision": "grant", "policyVersion": "privacy-v1", "method": "explicit-click"},
        headers={**headers, "Idempotency-Key": "grant-core-1"},
    )

    assert response.status_code == 200
    assert response.json()["state"] == "granted"


def test_update_consent_with_stale_policy_version_returns_problem_details() -> None:
    client = new_client()
    headers = request_context_header(sub="sub-1")
    client.post("/v1/cuenta", json={"ageGateRuleVersion": "age-gate-v1"}, headers=headers)

    response = client.patch(
        "/v1/consentimientos/core",
        json={"decision": "grant", "policyVersion": "privacy-v0", "method": "explicit-click"},
        headers={**headers, "Idempotency-Key": "stale-core-1"},
    )

    assert response.status_code == 409
    assert response.headers["content-type"].startswith("application/problem+json")
    assert response.json()["code"] == "POLICY_VERSION_STALE"


def test_two_different_subs_get_isolated_accounts() -> None:
    client = new_client()
    client.post(
        "/v1/cuenta",
        json={"ageGateRuleVersion": "age-gate-v1"},
        headers=request_context_header(sub="sub-a"),
    )
    client.patch(
        "/v1/consentimientos/core",
        json={"decision": "grant", "policyVersion": "privacy-v1", "method": "explicit-click"},
        headers={
            **request_context_header(sub="sub-a"),
            "Idempotency-Key": "grant-core-a",
        },
    )

    response_b = client.get("/v1/consentimientos", headers=request_context_header(sub="sub-b"))

    assert response_b.status_code == 404  # sub-b nunca hizo bootstrap de cuenta.


def test_request_context_header_constant_matches_lambda_web_adapter_header() -> None:
    assert REQUEST_CONTEXT_HEADER == "x-amzn-request-context"
