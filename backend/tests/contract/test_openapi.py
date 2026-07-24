from ponte_trucha.entrypoints.http.app import create_app


def test_openapi_declares_versioned_health_contract() -> None:
    schema = create_app().openapi()

    assert schema["openapi"] == "3.1.0"
    assert "/v1/health" in schema["paths"]
    assert schema["paths"]["/v1/health"]["get"]["responses"]["200"]
