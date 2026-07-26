from __future__ import annotations

from .http_helpers import new_client


def test_apps_catalog_is_public_and_lists_metadata_only() -> None:
    client = new_client()

    response = client.get("/v1/apps")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "public, max-age=300"
    body = response.json()
    assert {entry["appType"] for entry in body} == {
        "whatsapp",
        "sms",
        "email",
        "roblox",
        "discord",
    }
    for entry in body:
        assert set(entry.keys()) == {"appType", "displayName", "iconKey"}


def test_apps_catalog_never_requires_authentication() -> None:
    client = new_client()

    response = client.get("/v1/apps")

    assert response.status_code != 401
    assert response.status_code != 403
