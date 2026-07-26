import json

from ponte_trucha.entrypoints.http.app import create_app
from ponte_trucha.entrypoints.lambda_handler import handle_http_api_event

from .cognito_test_tokens import access_token, verifier


def _event_sin_authorizer(
    *,
    method: str,
    path: str,
    body: dict[str, object] | None = None,
    authorization: str | None = None,
) -> dict[str, object]:
    """Evento tal como lo entrega Floci: sin `requestContext.authorizer`."""

    headers: dict[str, str] = {"host": "localhost"}
    if authorization is not None:
        headers["Authorization"] = authorization
    return {
        "version": "2.0",
        "rawPath": path,
        "rawQueryString": "",
        "headers": headers,
        "requestContext": {
            "http": {
                "method": method,
                "path": path,
                "protocol": "HTTP/1.1",
                "sourceIp": "127.0.0.1",
            }
        },
        "body": json.dumps(body) if body is not None else None,
        "isBase64Encoded": False,
    }


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


def test_sin_verificador_un_evento_sin_authorizer_responde_401() -> None:
    """Comportamiento por defecto (AWS real): nadie inventa claims."""

    response = handle_http_api_event(
        create_app(),
        _event_sin_authorizer(
            method="GET", path="/v1/me", authorization=f"Bearer {access_token()}"
        ),
    )

    assert response["statusCode"] == 401


def test_verificador_local_reconstruye_los_claims_del_token_verificado() -> None:
    response = handle_http_api_event(
        create_app(),
        _event_sin_authorizer(
            method="POST",
            path="/v1/cuenta",
            body={"ageGateRuleVersion": "age-gate-v1"},
            authorization=f"Bearer {access_token()}",
        ),
        token_verifier=verifier(),
    )

    assert response["statusCode"] == 200


def test_verificador_local_rechaza_un_token_manipulado() -> None:
    response = handle_http_api_event(
        create_app(),
        _event_sin_authorizer(
            method="GET",
            path="/v1/me",
            authorization=f"Bearer {access_token(valid_signature=False)}",
        ),
        token_verifier=verifier(),
    )

    assert response["statusCode"] == 401


def test_verificador_local_no_pisa_los_claims_de_api_gateway() -> None:
    """En AWS real el evento ya trae claims: el puente no debe intervenir.

    El header lleva un token manipulado a propósito: si el puente se metiera,
    descartaría los claims válidos del authorizer y la respuesta sería 401.
    """

    event = _event(
        method="POST",
        path="/v1/cuenta",
        body={"ageGateRuleVersion": "age-gate-v1"},
    )
    headers = event["headers"]
    assert isinstance(headers, dict)
    headers["Authorization"] = f"Bearer {access_token(valid_signature=False)}"

    response = handle_http_api_event(create_app(), event, token_verifier=verifier())

    assert response["statusCode"] == 200
    assert json.loads(str(response["body"]))["ageGateRuleVersion"] == "age-gate-v1"
