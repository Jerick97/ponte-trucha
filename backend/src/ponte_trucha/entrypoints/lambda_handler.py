"""Adaptador HTTP API v2 mínimo para el runtime local de Floci.

AWS real usa Lambda Web Adapter. Floci actualmente no ejecuta la extensión
externa de esa layer, por lo que desarrollo usa este puente ASGI sin agregar
dependencias ni cambiar el contrato HTTP.
"""

from __future__ import annotations

import asyncio
import base64
import json
import os
from collections.abc import Mapping
from typing import cast

from starlette.types import ASGIApp, Message, Scope

from ponte_trucha.entrypoints.http.api_ia_app import create_ia_app
from ponte_trucha.entrypoints.http.app import create_app


def _string_mapping(value: object) -> dict[str, str]:
    if not isinstance(value, Mapping):
        return {}
    items = cast("Mapping[object, object]", value)
    return {str(key): str(item) for key, item in items.items()}


def _object_mapping(value: object) -> dict[str, object]:
    if not isinstance(value, Mapping):
        return {}
    items = cast("Mapping[object, object]", value)
    return {str(key): item for key, item in items.items()}


async def _invoke_asgi(app: ASGIApp, event: Mapping[str, object]) -> dict[str, object]:
    request_context = _object_mapping(event.get("requestContext"))
    http_context = _object_mapping(request_context.get("http"))
    raw_path = str(event.get("rawPath", http_context.get("path", "/")))
    raw_query = str(event.get("rawQueryString", ""))
    headers = _string_mapping(event.get("headers"))
    headers["x-amzn-request-context"] = json.dumps(request_context, separators=(",", ":"))

    raw_body = event.get("body")
    body = str(raw_body).encode() if raw_body is not None else b""
    if event.get("isBase64Encoded") is True:
        body = base64.b64decode(body)

    scope: Scope = {
        "type": "http",
        "asgi": {"version": "3.0", "spec_version": "2.3"},
        "http_version": "1.1",
        "method": str(http_context.get("method", "GET")),
        "scheme": headers.get("x-forwarded-proto", "http"),
        "path": raw_path,
        "raw_path": raw_path.encode(),
        "query_string": raw_query.encode(),
        "root_path": "",
        "headers": [(key.lower().encode(), value.encode()) for key, value in headers.items()],
        "client": (str(http_context.get("sourceIp", "127.0.0.1")), 0),
        "server": (headers.get("host", "localhost"), 80),
    }
    received = False
    response_status = 500
    response_headers: list[tuple[bytes, bytes]] = []
    response_parts: list[bytes] = []

    async def receive() -> Message:
        nonlocal received
        if received:
            return {"type": "http.disconnect"}
        received = True
        return {"type": "http.request", "body": body, "more_body": False}

    async def send(message: Message) -> None:
        nonlocal response_status, response_headers
        if message["type"] == "http.response.start":
            response_status = int(message["status"])
            response_headers = list(message.get("headers", []))
        elif message["type"] == "http.response.body":
            response_parts.append(bytes(message.get("body", b"")))

    await app(scope, receive, send)
    response_body = b"".join(response_parts)
    return {
        "statusCode": response_status,
        "headers": {
            key.decode(): value.decode()
            for key, value in response_headers
            if key.decode().lower() != "set-cookie"
        },
        "body": response_body.decode(),
        "isBase64Encoded": False,
    }


def handle_http_api_event(app: ASGIApp, event: Mapping[str, object]) -> dict[str, object]:
    return asyncio.run(_invoke_asgi(app, event))


_APP = create_ia_app() if os.environ.get("PTK_LAMBDA_APP") == "ia" else create_app()


def handler(event: Mapping[str, object], _context: object) -> dict[str, object]:
    return handle_http_api_event(_APP, event)
