"""Recorre el flujo completo contra un gateway local ya levantado.

Complementa a `tests/integration/test_local_flow.py`: las pruebas usan el ASGI
en proceso, esto habla HTTP de verdad contra `dev_server.py` para que una
persona (o el video de la demo) vea el flujo paso a paso.

    backend/.venv/bin/python backend/scripts/dev_server.py      # terminal 1
    backend/.venv/bin/python backend/scripts/smoke_local.py     # terminal 2

`scripts/probar-local.sh` hace las dos cosas y apaga el servidor al terminar.
El recorrido vive en `smoke_flow.py`, compartido con `smoke_floci.py`.
"""

from __future__ import annotations

import os
import secrets
import sys

import httpx
from dev_server import local_dev_token
from smoke_flow import SmokeError, run

BASE_URL_ENV = "PTK_LOCAL_BASE_URL"
DEFAULT_BASE_URL = "http://127.0.0.1:8000"


class LocalIdentities:
    """Adultos de juguete: el gateway local acepta `ptk-local.<sub>`."""

    def new_adult(self) -> dict[str, str]:
        sub = f"papa-{secrets.token_hex(4)}"
        return {"Authorization": f"Bearer {local_dev_token(sub)}"}


def main() -> int:
    base_url = os.environ.get(BASE_URL_ENV, DEFAULT_BASE_URL)
    print(f"Flujo local contra {base_url}\n")
    try:
        with httpx.Client(base_url=base_url, timeout=10.0) as client:
            run(client, LocalIdentities())
    except (SmokeError, httpx.HTTPError) as error:
        print(f"\nFALLÓ: {error}", file=sys.stderr)
        return 1
    print("\nFlujo completo en verde.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
