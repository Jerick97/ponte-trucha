"""Dependencia FastAPI que construye `AuthenticatedAdult` desde el JWT validado.

API Gateway HTTP API valida issuer, audiencia, expiración y scopes *antes* de
invocar Lambda (ADR-002). AWS Lambda Web Adapter reenvía ese contexto al
proceso FastAPI en el header `x-amzn-request-context` como un JSON con la
forma `requestContext.authorizer.jwt.claims` / `.scopes`
(https://aws.github.io/aws-lambda-web-adapter/features/request-context.html).

Este módulo NUNCA vuelve a validar la firma del token: esa responsabilidad es
de API Gateway. Solo lee claims ya autorizados y deriva `parentRef` a partir
de `sub`. Si el header falta o no tiene `sub`, se trata como no autenticado
(401): en un despliegue real API Gateway rechaza antes de llegar aquí, pero
Lambda no debe confiar ciegamente en un request que sortee esa capa (por
ejemplo, una invocación directa fuera de API Gateway).

`require_scope` agrega una segunda comprobación de defensa en profundidad: si
un cambio futuro en Terraform desincroniza el scope de una ruta, un test HTTP
lo detecta aquí en vez de depender solo de la configuración de infraestructura.
"""

from __future__ import annotations

import json
from collections.abc import Callable
from typing import cast

from fastapi import HTTPException, Request, status

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.ports import ParentRefDeriver

REQUEST_CONTEXT_HEADER = "x-amzn-request-context"

AdultDependency = Callable[[Request], AuthenticatedAdult]


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Se requiere un access token válido.",
    )


def _as_str_object_dict(value: object) -> dict[str, object] | None:
    """Type guard: valida que `value` sea un `dict[str, object]` real."""

    if not isinstance(value, dict):
        return None
    raw_items = cast("dict[object, object]", value)
    return {str(key): item for key, item in raw_items.items()}


def _extract_claims(request: Request) -> dict[str, object]:
    raw_context = request.headers.get(REQUEST_CONTEXT_HEADER)
    if raw_context is None:
        raise _unauthorized()

    try:
        parsed_raw: object = json.loads(raw_context)
    except json.JSONDecodeError as error:
        raise _unauthorized() from error

    parsed = _as_str_object_dict(parsed_raw)
    authorizer = _as_str_object_dict(parsed.get("authorizer")) if parsed else None
    jwt_context = _as_str_object_dict(authorizer.get("jwt")) if authorizer else None
    claims = _as_str_object_dict(jwt_context.get("claims")) if jwt_context else None
    if claims is None:
        raise _unauthorized()

    return claims


def _scopes_from_claims(claims: dict[str, object]) -> frozenset[str]:
    raw_scope = claims.get("scope")
    if not isinstance(raw_scope, str) or not raw_scope:
        return frozenset()
    # Cognito emite los scopes del resource server con prefijo
    # ("ponte-trucha-api/game.play"); las rutas los exigen sin prefijo. Se
    # aceptan ambas formas para no acoplarse al identificador del pool.
    scopes = raw_scope.split(" ")
    return frozenset(scopes) | frozenset(scope.rsplit("/", 1)[-1] for scope in scopes)


def build_authenticated_adult_dependency(
    *, parent_ref_deriver: ParentRefDeriver
) -> AdultDependency:
    """Fábrica de la dependencia base, para inyectar el deriver de composición."""

    def dependency(request: Request) -> AuthenticatedAdult:
        claims = _extract_claims(request)
        cognito_sub = claims.get("sub")
        if not isinstance(cognito_sub, str) or not cognito_sub:
            raise _unauthorized()

        parent_ref = parent_ref_deriver.derive(cognito_sub=cognito_sub)
        return AuthenticatedAdult(parent_ref=parent_ref, scopes=_scopes_from_claims(claims))

    return dependency


def require_scope(adult_dependency: AdultDependency, *, scope: str) -> AdultDependency:
    """Envuelve una dependencia de adulto exigiendo un scope adicional."""

    def dependency(request: Request) -> AuthenticatedAdult:
        adult = adult_dependency(request)
        if not adult.has_scope(scope):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El access token no incluye el scope requerido.",
            )
        return adult

    return dependency
