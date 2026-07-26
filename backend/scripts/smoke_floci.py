"""Recorre el flujo completo contra el emulador, con login real de Cognito.

A diferencia de `smoke_local.py`, aquí no hay atajos: cada adulto es un usuario
del User Pool, el access token lo firma Cognito, API Gateway lo valida y las
Lambdas escriben en DynamoDB.

    export AWS_ENDPOINT_URL=http://localhost:4566
    export AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test
    export AWS_DEFAULT_REGION=us-east-1
    backend/.venv/bin/python backend/scripts/smoke_floci.py

`scripts/probar-floci.sh` lo ejecuta después de `check_floci.py`.
"""

from __future__ import annotations

import sys

import httpx
from floci_cognito import FlociDeployment, access_token, create_confirmed_adult, discover_deployment
from smoke_flow import SmokeError, run


class CognitoIdentities:
    """Cada adulto es un usuario real del User Pool emulado."""

    def __init__(self, deployment: FlociDeployment) -> None:
        self._deployment = deployment

    def new_adult(self) -> dict[str, str]:
        email, password = create_confirmed_adult(self._deployment)
        token = access_token(self._deployment, email=email, password=password)
        return {"Authorization": f"Bearer {token}"}


def main() -> int:
    try:
        deployment = discover_deployment()
    except RuntimeError as error:
        print(f"FALLÓ: {error}", file=sys.stderr)
        return 1

    print(f"Flujo contra el emulador: {deployment.api_base_url}\n")
    try:
        with httpx.Client(base_url=deployment.api_base_url, timeout=60.0) as client:
            run(client, CognitoIdentities(deployment))
    except (SmokeError, RuntimeError, httpx.HTTPError) as error:
        print(f"\nFALLÓ: {error}", file=sys.stderr)
        return 1
    print("\nFlujo completo en verde contra Cognito, API Gateway, Lambda y DynamoDB.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
