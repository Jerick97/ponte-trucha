# pyright: reportUnknownMemberType=false
from __future__ import annotations

import json
import os
import sys
from typing import Protocol, TypedDict, cast
from urllib.request import urlopen

import boto3


class DynamoDbResponse(TypedDict):
    TableNames: list[str]


class CognitoPool(TypedDict):
    Name: str


class CognitoResponse(TypedDict):
    UserPools: list[CognitoPool]


class HttpApi(TypedDict):
    ApiId: str
    Name: str


class HttpApiResponse(TypedDict):
    Items: list[HttpApi]


class DynamoDbClient(Protocol):
    def list_tables(self) -> DynamoDbResponse: ...


class CognitoClient(Protocol):
    def list_user_pools(self, *, MaxResults: int) -> CognitoResponse: ...


class HttpApiClient(Protocol):
    def get_apis(self) -> HttpApiResponse: ...


ENVIRONMENT = os.environ.get("PTK_ENVIRONMENT", "dev")
EXPECTED = {
    "api": f"ptk-api-{ENVIRONMENT}",
    "idempotency_table": f"ptk-idempotency-{ENVIRONMENT}",
    "domain_table": f"ptk-domain-{ENVIRONMENT}",
    "user_pool": f"ptk-adults-{ENVIRONMENT}",
}


def _client(service_name: str) -> object:
    return cast(
        object,
        boto3.client(
            service_name,
            endpoint_url=os.environ["AWS_ENDPOINT_URL"],
            region_name=os.environ.get("AWS_DEFAULT_REGION", "us-east-1"),
        ),
    )


def _require(value: str, values: set[str], resource: str) -> None:
    if value not in values:
        raise RuntimeError(f"No se encontró {resource}: {value}")


def main() -> None:
    dynamodb = cast(DynamoDbClient, _client("dynamodb"))
    cognito = cast(CognitoClient, _client("cognito-idp"))
    api_gateway = cast(HttpApiClient, _client("apigatewayv2"))

    _require(EXPECTED["domain_table"], set(dynamodb.list_tables()["TableNames"]), "tabla")
    _require(EXPECTED["idempotency_table"], set(dynamodb.list_tables()["TableNames"]), "tabla")
    _require(
        EXPECTED["user_pool"],
        {pool["Name"] for pool in cognito.list_user_pools(MaxResults=60)["UserPools"]},
        "User Pool",
    )
    apis = api_gateway.get_apis()["Items"]
    _require(EXPECTED["api"], {api["Name"] for api in apis}, "HTTP API")
    api_id = next(api["ApiId"] for api in apis if api["Name"] == EXPECTED["api"])

    endpoint = os.environ["AWS_ENDPOINT_URL"].rstrip("/")
    for path, expected_service in (
        ("/v1/health", "api-core"),
        ("/v1/ia/health", "api-ia"),
    ):
        invocation_url = f"{endpoint}/restapis/{api_id}/$default/_user_request_{path}"
        with urlopen(invocation_url, timeout=30) as response:  # noqa: S310
            payload = json.loads(response.read())
            if response.status != 200 or payload.get("service") != expected_service:
                raise RuntimeError(f"Health inválido para {expected_service}.")

    print("Floci contiene la infraestructura y ambas APIs responden correctamente.")


if __name__ == "__main__":
    try:
        main()
    except (KeyError, RuntimeError) as error:
        print(error, file=sys.stderr)
        raise SystemExit(1) from error
