"""Mapeo de errores de dominio a `application/problem+json` (RFC 9457).

Ningún mensaje interno ni traza se expone al cliente: cada código de dominio
tiene un título y estado HTTP fijos, definidos en el diseño de
`autenticacion-consentimiento-parental`.
"""

from __future__ import annotations

from dataclasses import dataclass

from fastapi import Request
from fastapi.responses import JSONResponse

from ponte_trucha.domain.errors import (
    AccountNotActiveError,
    AccountNotFoundError,
    ConsentRequiredError,
    DomainError,
    IdempotencyConflictError,
    InvalidConsentTransitionError,
    InvalidProfileSelectionError,
    NoEligibleScenarioError,
    PolicyVersionStaleError,
    ProfileLimitReachedError,
    ProfileNotFoundError,
)

PROBLEM_BASE_URL = "https://ponte-trucha.pe/problems"


@dataclass(frozen=True, slots=True)
class _ProblemMapping:
    status: int
    title: str


_MAPPINGS: dict[type[DomainError], _ProblemMapping] = {
    AccountNotActiveError: _ProblemMapping(409, "Cuenta en proceso de borrado"),
    AccountNotFoundError: _ProblemMapping(404, "Cuenta no encontrada"),
    ConsentRequiredError: _ProblemMapping(403, "Falta consentimiento vigente"),
    IdempotencyConflictError: _ProblemMapping(409, "Conflicto de idempotencia"),
    InvalidConsentTransitionError: _ProblemMapping(409, "Transición de consentimiento inválida"),
    InvalidProfileSelectionError: _ProblemMapping(422, "Selección de perfil inválida"),
    NoEligibleScenarioError: _ProblemMapping(409, "Sin escenarios elegibles"),
    PolicyVersionStaleError: _ProblemMapping(409, "Versión de política desactualizada"),
    ProfileLimitReachedError: _ProblemMapping(409, "Límite de perfiles alcanzado"),
    ProfileNotFoundError: _ProblemMapping(404, "Perfil no encontrado"),
}


def domain_error_response(error: DomainError) -> JSONResponse:
    mapping = _MAPPINGS.get(type(error), _ProblemMapping(400, "Solicitud inválida"))
    return JSONResponse(
        content={
            "type": f"{PROBLEM_BASE_URL}/{error.code.lower().replace('_', '-')}",
            "title": mapping.title,
            "status": mapping.status,
            "detail": mapping.title,
            "code": error.code,
        },
        media_type="application/problem+json",
        status_code=mapping.status,
    )


def domain_error_handler(_: Request, exc: Exception) -> JSONResponse:
    if isinstance(exc, DomainError):
        return domain_error_response(exc)
    raise exc
