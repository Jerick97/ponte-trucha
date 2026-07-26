"""Gateway local de desarrollo. **Nunca** se empaqueta ni se despliega.

En AWS, API Gateway valida el access token de Cognito y AWS Lambda Web Adapter
reenvía los claims a FastAPI en el header `x-amzn-request-context` (ADR-002).
En local no hay API Gateway, así que este puente hace tres cosas y nada más:

1. traduce `Authorization: Bearer ptk-local.<sub>` a ese header de contexto,
   descartando cualquier `x-amzn-request-context` que llegue del cliente;
2. enruta `/v1/ia/*` y `/v1/conversaciones/*` a la app `api-ia` y el resto a
   `api-core`, igual que hacen las rutas de API Gateway;
3. permite CORS solo para el servidor de Vite en localhost.

Vive en `backend/scripts/` a propósito: `scripts/package_lambdas.py` solo copia
`src/ponte_trucha`, así que este atajo de autenticación no puede terminar en el
zip de Lambda. Además se niega a arrancar si detecta configuración persistente
(DynamoDB, Secrets Manager) o un entorno Lambda: es un juguete de escritorio con
repositories en memoria, no una puerta trasera para datos reales.

Uso:

    backend/.venv/bin/python backend/scripts/dev_server.py
    curl -H "Authorization: Bearer ptk-local.papa-demo" http://127.0.0.1:8000/v1/me
"""

from __future__ import annotations

import json
import os
import sys
from collections.abc import Iterable
from pathlib import Path
from typing import cast

# El script se ejecuta directo (`python backend/scripts/dev_server.py`), así que
# publica `backend/src` en la ruta de importación. En pytest lo hace `pyproject`.
_SRC_ROOT = Path(__file__).parents[1] / "src"
if str(_SRC_ROOT) not in sys.path:
    sys.path.insert(0, str(_SRC_ROOT))

from starlette.middleware.cors import CORSMiddleware  # noqa: E402
from starlette.types import ASGIApp, Receive, Scope, Send  # noqa: E402

from ponte_trucha.entrypoints.http.api_ia_app import create_ia_app  # noqa: E402
from ponte_trucha.entrypoints.http.app import create_app  # noqa: E402

REQUEST_CONTEXT_HEADER = b"x-amzn-request-context"
LOCAL_AUTH_TOKEN_PREFIX = "ptk-local."
DEV_SCOPES_HEADER = b"x-dev-scopes"
IA_PATH_PREFIXES = ("/v1/ia", "/v1/conversaciones")

# Mismos scopes que declara el resource server de Cognito en
# `infra/modules/identity`. `X-Dev-Scopes` permite recortarlos para probar 403.
ALL_SCOPES: tuple[str, ...] = (
    "account.delete",
    "consents.read",
    "consents.write",
    "game.play",
    "profiles.read",
    "profiles.write",
)

# Si alguna de estas variables existe, el proceso no es un escritorio local:
# está apuntando a datos persistentes o corriendo dentro de Lambda.
PERSISTENT_MODE_ENV_VARS: tuple[str, ...] = (
    "AWS_LAMBDA_FUNCTION_NAME",
    "DOMAIN_TABLE_NAME",
    "HMAC_SECRET_ARN",
    "IDEMPOTENCY_TABLE_NAME",
)

DEFAULT_ALLOWED_ORIGINS = ("http://localhost:5173", "http://127.0.0.1:5173")
ALLOWED_ORIGINS_ENV = "PTK_LOCAL_ALLOWED_ORIGINS"
HOST_ENV = "PTK_LOCAL_HOST"
PORT_ENV = "PTK_LOCAL_PORT"
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8000


def local_dev_token(sub: str) -> str:
    """Token de juguete que el puente acepta para el `sub` indicado."""

    return f"{LOCAL_AUTH_TOKEN_PREFIX}{sub}"


def _guard_local_only() -> None:
    present = [name for name in PERSISTENT_MODE_ENV_VARS if os.environ.get(name)]
    if present:
        raise RuntimeError(
            "El gateway local solo corre con repositories en memoria. "
            f"Quita estas variables antes de usarlo: {', '.join(present)}."
        )


def _headers(scope: Scope) -> list[tuple[bytes, bytes]]:
    raw = cast("Iterable[tuple[bytes, bytes]]", scope.get("headers") or ())
    return [(name.lower(), value) for name, value in raw]


def _header_value(headers: list[tuple[bytes, bytes]], name: bytes) -> str | None:
    for header_name, value in headers:
        if header_name == name:
            return value.decode("latin-1")
    return None


def _scopes_from_headers(headers: list[tuple[bytes, bytes]]) -> tuple[str, ...]:
    requested = _header_value(headers, DEV_SCOPES_HEADER)
    if requested is None:
        return ALL_SCOPES
    return tuple(scope for scope in requested.split(" ") if scope)


def _sub_from_authorization(headers: list[tuple[bytes, bytes]]) -> str | None:
    authorization = _header_value(headers, b"authorization")
    if authorization is None:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.startswith(LOCAL_AUTH_TOKEN_PREFIX):
        return None
    return token[len(LOCAL_AUTH_TOKEN_PREFIX) :].strip() or None


def _request_context(sub: str, scopes: tuple[str, ...]) -> bytes:
    payload = {
        "authorizer": {
            "jwt": {
                "claims": {"scope": " ".join(scopes), "sub": sub},
                "scopes": list(scopes),
            }
        }
    }
    return json.dumps(payload, separators=(",", ":")).encode()


class LocalGateway:
    """Reemplazo local del JWT authorizer y del routing de API Gateway."""

    def __init__(self, *, core_app: ASGIApp, ia_app: ASGIApp) -> None:
        self._core_app = core_app
        self._ia_app = ia_app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self._core_app(scope, receive, send)
            return

        headers = [item for item in _headers(scope) if item[0] != REQUEST_CONTEXT_HEADER]
        sub = _sub_from_authorization(headers)
        if sub is not None:
            headers.append(
                (REQUEST_CONTEXT_HEADER, _request_context(sub, _scopes_from_headers(headers)))
            )

        path = str(scope.get("path", "/"))
        target = self._ia_app if path.startswith(IA_PATH_PREFIXES) else self._core_app
        await target({**scope, "headers": headers}, receive, send)


def _allowed_origins() -> list[str]:
    configured = os.environ.get(ALLOWED_ORIGINS_ENV)
    if not configured:
        return list(DEFAULT_ALLOWED_ORIGINS)
    return [origin.strip() for origin in configured.split(",") if origin.strip()]


def build_local_app() -> ASGIApp:
    """Arma el puente local. Falla si el entorno no es de escritorio."""

    _guard_local_only()
    core_app = create_app()
    ia_app = create_ia_app()
    # En AWS las dos Lambdas comparten DynamoDB. En local cada app construye sus
    # propios repositories en memoria, así que se comparte la composición para
    # que `api-ia` vea la cuenta y el consentimiento creados vía `api-core`.
    ia_app.state.use_cases = core_app.state.use_cases
    gateway = LocalGateway(core_app=core_app, ia_app=ia_app)
    return CORSMiddleware(
        app=gateway,
        allow_credentials=False,
        allow_headers=["authorization", "content-type", "idempotency-key", "x-dev-scopes"],
        allow_methods=["DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT"],
        allow_origins=_allowed_origins(),
        expose_headers=["idempotency-replayed"],
    )


def main() -> None:
    import uvicorn

    host = os.environ.get(HOST_ENV, DEFAULT_HOST)
    port = int(os.environ.get(PORT_ENV, str(DEFAULT_PORT)))
    print(f"API local en http://{host}:{port} (memoria, sin AWS)")
    print(f"Token de prueba: Authorization: Bearer {local_dev_token('papa-demo')}")
    print("Atajo de auth solo para desarrollo: no exponer este puerto a la red.")
    uvicorn.run(build_local_app(), host=host, log_level="info", port=port)


if __name__ == "__main__":
    main()
