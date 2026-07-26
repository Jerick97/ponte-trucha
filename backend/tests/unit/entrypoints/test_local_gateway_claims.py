"""Pruebas del verificador de access tokens del User Pool emulado."""

from __future__ import annotations

import json

import pytest

from ponte_trucha.entrypoints.local_gateway_claims import (
    CLIENT_ID_ENV,
    ENABLED_ENV,
    ENABLED_VALUE,
    ENDPOINT_ENV,
    SCOPES_ENV,
    USER_POOL_ID_ENV,
    InvalidLocalTokenError,
    build_verifier_from_environment,
)

from .cognito_test_tokens import (
    CLIENT_ID,
    NOW,
    SCOPES,
    USER_POOL_ID,
    access_token,
    b64url,
    verifier,
)


def test_token_valido_produce_sub_y_scopes_configurados() -> None:
    claims = verifier().claims_for(f"Bearer {access_token()}")

    assert claims == {"sub": "adulto-1", "scope": "profiles.read game.play"}


def test_sin_authorization_no_hay_claims() -> None:
    verificador = verifier()

    assert verificador.claims_for(None) is None
    assert verificador.claims_for("") is None
    assert verificador.claims_for("Basic abc") is None
    assert verificador.claims_for("Bearer   ") is None


@pytest.mark.parametrize(
    "token",
    [
        pytest.param(access_token(valid_signature=False), id="firma-manipulada"),
        pytest.param(access_token(alg="none"), id="alg-none"),
        pytest.param(access_token(kid="otro-kid"), id="kid-desconocido"),
        pytest.param(access_token(claims={"exp": int(NOW) - 1}), id="vencido"),
        pytest.param(access_token(claims={"token_use": "id"}), id="id-token"),
        pytest.param(access_token(claims={"client_id": "otro-cliente"}), id="otro-app-client"),
        pytest.param(
            access_token(claims={"iss": "http://localhost:4566/us-east-1_otro"}),
            id="otro-user-pool",
        ),
        pytest.param(access_token(claims={"sub": ""}), id="sin-sub"),
        pytest.param("no.es.un.token", id="formato-invalido"),
        pytest.param("solo-un-segmento", id="sin-segmentos"),
    ],
)
def test_tokens_invalidos_se_rechazan(token: str) -> None:
    with pytest.raises(InvalidLocalTokenError):
        verifier().claims_for(f"Bearer {token}")


def test_payload_manipulado_invalida_la_firma() -> None:
    header, _body, signature = access_token().split(".")
    forjado = b64url(
        json.dumps(
            {
                "sub": "otro-adulto",
                "token_use": "access",
                "iss": f"http://localhost:4566/{USER_POOL_ID}",
                "client_id": CLIENT_ID,
                "exp": int(NOW) + 3600,
            }
        ).encode()
    )

    with pytest.raises(InvalidLocalTokenError):
        verifier().claims_for(f"Bearer {header}.{forjado}.{signature}")


def test_verificador_apagado_por_defecto(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv(ENABLED_ENV, raising=False)

    assert build_verifier_from_environment() is None


def test_verificador_habilitado_exige_configuracion_completa(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv(ENABLED_ENV, ENABLED_VALUE)
    monkeypatch.delenv(USER_POOL_ID_ENV, raising=False)
    monkeypatch.delenv(CLIENT_ID_ENV, raising=False)
    monkeypatch.delenv(ENDPOINT_ENV, raising=False)

    with pytest.raises(RuntimeError):
        build_verifier_from_environment()


def test_verificador_habilitado_exige_scopes(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv(ENABLED_ENV, ENABLED_VALUE)
    monkeypatch.setenv(USER_POOL_ID_ENV, USER_POOL_ID)
    monkeypatch.setenv(CLIENT_ID_ENV, CLIENT_ID)
    monkeypatch.setenv(ENDPOINT_ENV, "http://localhost:4566")
    monkeypatch.setenv(SCOPES_ENV, "  ")

    with pytest.raises(RuntimeError):
        build_verifier_from_environment()


def test_verificador_habilitado_se_construye_con_configuracion(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv(ENABLED_ENV, ENABLED_VALUE)
    monkeypatch.setenv(USER_POOL_ID_ENV, USER_POOL_ID)
    monkeypatch.setenv(CLIENT_ID_ENV, CLIENT_ID)
    monkeypatch.setenv(ENDPOINT_ENV, "http://localhost:4566")
    monkeypatch.setenv(SCOPES_ENV, "profiles.read game.play")

    verificador = build_verifier_from_environment()

    assert verificador is not None
    assert verificador.scopes == SCOPES
