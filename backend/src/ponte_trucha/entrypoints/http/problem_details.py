"""Mapeo de errores de dominio a `application/problem+json` (RFC 9457).

Ningún mensaje interno ni traza se expone al cliente: cada código de dominio
tiene un título y estado HTTP fijos, definidos en el diseño de
`autenticacion-consentimiento-parental`.
"""

from __future__ import annotations

from dataclasses import dataclass

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from ponte_trucha.domain.challenge import ChallengeAlreadyAnsweredError, ChallengeExpiredError
from ponte_trucha.domain.errors import (
    AccountNotActiveError,
    AccountNotFoundError,
    ChallengeNotFoundError,
    ConsentRequiredError,
    ConversationNotAllowedError,
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
    ChallengeAlreadyAnsweredError: _ProblemMapping(409, "Reto ya respondido"),
    ChallengeExpiredError: _ProblemMapping(409, "Reto expirado"),
    ChallengeNotFoundError: _ProblemMapping(404, "Reto no encontrado"),
    ConsentRequiredError: _ProblemMapping(403, "Falta consentimiento vigente"),
    ConversationNotAllowedError: _ProblemMapping(409, "Conversación no disponible"),
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


VALIDATION_ERROR_CODE = "VALIDATION_ERROR"


def validation_error_handler(_: Request, exc: Exception) -> JSONResponse:
    """Convierte los 422 de Pydantic/FastAPI a `problem+json` sin eco del input.

    El handler por defecto de FastAPI responde `{"detail": [...]}` e incluye el
    valor recibido (`input`), que en este producto puede ser texto del niño o
    una `Idempotency-Key`. Aquí solo salen la ubicación del campo y el tipo de
    error: nada del cuerpo enviado.
    """

    fields: list[dict[str, str]] = []
    if isinstance(exc, RequestValidationError):
        for error in exc.errors():
            location = ".".join(str(part) for part in error.get("loc", ()))
            fields.append({"field": location, "code": str(error.get("type", "invalid"))})

    return JSONResponse(
        content={
            "type": f"{PROBLEM_BASE_URL}/validation-error",
            "title": "Solicitud inválida",
            "status": 422,
            "detail": "Revisa los campos enviados.",
            "code": VALIDATION_ERROR_CODE,
            "errors": fields,
        },
        media_type="application/problem+json",
        status_code=422,
    )
