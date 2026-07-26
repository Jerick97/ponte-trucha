"""Utilidades de Cognito para el emulador local (Floci).

Solo se usan desde scripts de desarrollo: descubren el despliegue emulado y
crean cuentas adultas confirmadas. El emulador no entrega el correo de
verificación, así que confirmar por API es la única forma de tener una cuenta
utilizable en local; en AWS real ese paso lo hace el adulto desde su correo.

Nunca se empaqueta en Lambda: vive en `backend/scripts/`.
"""

from __future__ import annotations

import os
import secrets
from dataclasses import dataclass
from typing import Any, cast

import boto3

ENDPOINT_ENV = "AWS_ENDPOINT_URL"
REGION_ENV = "AWS_DEFAULT_REGION"
ENVIRONMENT_ENV = "PTK_ENVIRONMENT"
DEFAULT_REGION = "us-east-1"
DEFAULT_PASSWORD_SUFFIX = "Aa1!"  # cumple la política del User Pool


def _client(service_name: str) -> Any:
    endpoint = os.environ.get(ENDPOINT_ENV)
    if not endpoint:
        raise RuntimeError(f"Define {ENDPOINT_ENV} con el endpoint del emulador.")
    return cast(
        Any,
        boto3.client(  # pyright: ignore[reportUnknownMemberType]
            service_name,
            endpoint_url=endpoint,
            region_name=os.environ.get(REGION_ENV, DEFAULT_REGION),
        ),
    )


@dataclass(frozen=True, slots=True)
class FlociDeployment:
    """Coordenadas del despliegue emulado, descubiertas por nombre."""

    api_id: str
    user_pool_id: str
    client_id: str

    @property
    def api_base_url(self) -> str:
        endpoint = os.environ[ENDPOINT_ENV].rstrip("/")
        return f"{endpoint}/restapis/{self.api_id}/$default/_user_request_"


def discover_deployment() -> FlociDeployment:
    environment = os.environ.get(ENVIRONMENT_ENV, "dev")
    api_name = f"ptk-api-{environment}"
    pool_name = f"ptk-adults-{environment}"

    apis = _client("apigatewayv2").get_apis()["Items"]
    api_id = next((api["ApiId"] for api in apis if api["Name"] == api_name), None)
    if api_id is None:
        raise RuntimeError(f"No se encontró el HTTP API {api_name} en el emulador.")

    cognito = _client("cognito-idp")
    pools = cognito.list_user_pools(MaxResults=60)["UserPools"]
    user_pool_id = next((pool["Id"] for pool in pools if pool["Name"] == pool_name), None)
    if user_pool_id is None:
        raise RuntimeError(f"No se encontró el User Pool {pool_name} en el emulador.")

    clients = cognito.list_user_pool_clients(UserPoolId=user_pool_id, MaxResults=10)
    client_id = next(
        (
            item["ClientId"]
            for item in clients["UserPoolClients"]
            if item["ClientName"] == f"ptk-spa-{environment}"
        ),
        None,
    )
    if client_id is None:
        raise RuntimeError("No se encontró el app client de la SPA en el emulador.")

    return FlociDeployment(api_id=api_id, user_pool_id=user_pool_id, client_id=client_id)


def create_confirmed_adult(
    deployment: FlociDeployment, *, email: str | None = None, password: str | None = None
) -> tuple[str, str]:
    """Crea (o reusa) una cuenta adulta confirmada y devuelve correo y clave."""

    cognito = _client("cognito-idp")
    adult_email = email or f"papa-{secrets.token_hex(4)}@ejemplo.local"
    adult_password = password or f"Trucha-{secrets.token_hex(6)}{DEFAULT_PASSWORD_SUFFIX}"

    try:
        cognito.admin_create_user(
            UserPoolId=deployment.user_pool_id,
            Username=adult_email,
            MessageAction="SUPPRESS",
            UserAttributes=[
                {"Name": "email", "Value": adult_email},
                {"Name": "email_verified", "Value": "true"},
            ],
        )
    except cognito.exceptions.UsernameExistsException:
        pass

    cognito.admin_set_user_password(
        UserPoolId=deployment.user_pool_id,
        Username=adult_email,
        Password=adult_password,
        Permanent=True,
    )
    return adult_email, adult_password


def confirm_adult(deployment: FlociDeployment, *, email: str) -> None:
    """Confirma una cuenta creada desde el navegador (el emulador no manda correo)."""

    cognito = _client("cognito-idp")
    cognito.admin_confirm_sign_up(UserPoolId=deployment.user_pool_id, Username=email)
    cognito.admin_update_user_attributes(
        UserPoolId=deployment.user_pool_id,
        Username=email,
        UserAttributes=[{"Name": "email_verified", "Value": "true"}],
    )


def access_token(deployment: FlociDeployment, *, email: str, password: str) -> str:
    """Inicia sesión con la clave del adulto y devuelve su access token."""

    response: Any = _client("cognito-idp").initiate_auth(
        ClientId=deployment.client_id,
        AuthFlow="USER_PASSWORD_AUTH",
        AuthParameters={"USERNAME": email, "PASSWORD": password},
    )
    result: dict[str, Any] = response.get("AuthenticationResult") or {}
    token: object = result.get("AccessToken")
    if not isinstance(token, str) or not token:
        raise RuntimeError("Cognito no devolvió un access token.")
    return token
