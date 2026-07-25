import json

from ponte_trucha.entrypoints.http.app import create_app
from ponte_trucha.entrypoints.lambda_handler import handle_http_api_event


def _event(*, method: str, path: str, body: dict[str, object] | None = None) -> dict[str, object]:
    return {
        "version": "2.0",
        "rawPath": path,
        "rawQueryString": "",
        "headers": {"host": "localhost"},
        "requestContext": {
            "http": {
                "method": method,
                "path": path,
                "protocol": "HTTP/1.1",
                "sourceIp": "127.0.0.1",
            },
            "authorizer": {
                "jwt": {
                    "claims": {
                        "sub": "adult-1",
                        "scope": "profiles.read",
                    },
                    "scopes": ["profiles.read"],
                }
            },
        },
        "body": json.dumps(body) if body is not None else None,
        "isBase64Encoded": False,
    }


def test_native_lambda_handler_serves_public_fastapi_route() -> None:
    response = handle_http_api_event(create_app(), _event(method="GET", path="/v1/health"))

    assert response["statusCode"] == 200
    assert json.loads(str(response["body"]))["service"] == "api-core"


def test_native_lambda_handler_forwards_authorizer_context() -> None:
    response = handle_http_api_event(
        create_app(),
        _event(
            method="POST",
            path="/v1/cuenta",
            body={"ageGateRuleVersion": "adult-self-declaration-v1"},
        ),
    )

    assert response["statusCode"] == 200
    assert json.loads(str(response["body"]))["ageGateRuleVersion"] == ("adult-self-declaration-v1")
