"""Excepciones de dominio. No exponen mensajes internos al cliente HTTP."""

from __future__ import annotations


class DomainError(Exception):
    """Error base de dominio con un código estable para mapear a HTTP."""

    code: str = "DOMAIN_ERROR"

    def __init__(self, message: str = "") -> None:
        super().__init__(message or self.code)


class AccountNotActiveError(DomainError):
    """La cuenta adulta está en `deleting` y rechaza nuevas mutaciones."""

    code = "ACCOUNT_NOT_ACTIVE"


class AccountNotFoundError(DomainError):
    """No existe una cuenta adulta provisionada para este `parentRef`."""

    code = "ACCOUNT_NOT_FOUND"


class ConsentRequiredError(DomainError):
    """Falta un consentimiento vigente para la finalidad solicitada."""

    code = "CONSENT_REQUIRED"


class InvalidConsentTransitionError(DomainError):
    """La transición de estado de consentimiento solicitada no es válida."""

    code = "INVALID_CONSENT_TRANSITION"


class ProfileNotFoundError(DomainError):
    """El perfil no existe o no pertenece al adulto autenticado."""

    code = "PROFILE_NOT_FOUND"


class ProfileLimitReachedError(DomainError):
    """El adulto alcanzó el máximo de perfiles infantiles permitidos."""

    code = "PROFILE_LIMIT_REACHED"


class InvalidProfileSelectionError(DomainError):
    """El alias o avatar elegido no pertenece al catálogo cerrado."""

    code = "INVALID_PROFILE_SELECTION"


class PolicyVersionStaleError(DomainError):
    """La decisión de consentimiento no usa la versión vigente de la política."""

    code = "POLICY_VERSION_STALE"


class IdempotencyConflictError(DomainError):
    """La misma `Idempotency-Key` se reutilizó con un request distinto."""

    code = "IDEMPOTENCY_CONFLICT"


class ChallengeNotFoundError(DomainError):
    """El reto no existe o no pertenece al adulto autenticado."""

    code = "CHALLENGE_NOT_FOUND"


class NoEligibleScenarioError(DomainError):
    """El banco curado no tiene ningún escenario elegible para emitir."""

    code = "NO_ELIGIBLE_SCENARIO"


class ConversationNotAllowedError(DomainError):
    """El reto no admite conversación o todavía no fue respondido.

    El chat con el personaje se abre recién después del intento: antes sería
    una pista gratis de que el mensaje es una trampa.
    """

    code = "CONVERSATION_NOT_ALLOWED"


class ScenarioGenerationError(DomainError):
    """El generador de escenarios no devolvió un candidato utilizable.

    Cubre respuestas vacías, JSON inválido o campos faltantes. Nunca lleva el
    texto recibido: se registra el código y se cae al banco curado.
    """

    code = "SCENARIO_GENERATION_FAILED"
