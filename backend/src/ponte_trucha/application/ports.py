"""Puertos (Protocols) que los casos de uso declaran e implementan los adapters.

`application` no importa boto3, FastAPI ni ningún SDK externo. Los adapters
concretos (memoria, DynamoDB) viven en `ponte_trucha.adapters`.
"""

from __future__ import annotations

from typing import Protocol

from ponte_trucha.domain.challenge import Challenge
from ponte_trucha.domain.child_profile import ChildProfile
from ponte_trucha.domain.consent import ConsentRecord
from ponte_trucha.domain.parent_account import ParentAccount
from ponte_trucha.domain.progress import Progress
from ponte_trucha.domain.value_objects import ConsentPurpose


class Clock(Protocol):
    """Fuente de tiempo UTC en RFC 3339, para mantener el dominio testeable."""

    def now(self) -> str: ...


class IdGenerator(Protocol):
    """Generador de identificadores opacos (childId, eventId, etc.)."""

    def new_id(self, *, prefix: str) -> str: ...


class ParentRefDeriver(Protocol):
    """Deriva `parentRef` desde el `sub` de Cognito sin exponer el secreto HMAC.

    Ver ADR-003: `parentRef = base64url(HMAC-SHA256(secretKey[keyVersion], sub))`.
    El backend nunca acepta un `parentRef` enviado por el cliente.
    """

    def derive(self, *, cognito_sub: str) -> str: ...


class ParentAccountRepository(Protocol):
    """Acceso a la cuenta adulta bajo `PARENT#{parentRef}` / `ACCOUNT`."""

    def get(self, *, parent_ref: str) -> ParentAccount | None: ...

    def create(self, account: ParentAccount) -> None: ...

    def save(self, account: ParentAccount) -> None: ...


class ConsentRepository(Protocol):
    """Acceso a las decisiones de consentimiento de un adulto."""

    def get(self, *, parent_ref: str, purpose: ConsentPurpose) -> ConsentRecord | None: ...

    def list_for_parent(self, *, parent_ref: str) -> tuple[ConsentRecord, ...]: ...

    def save(self, *, parent_ref: str, record: ConsentRecord) -> None: ...


class ChildProfileRepository(Protocol):
    """Acceso a perfiles infantiles bajo la partición del adulto propietario."""

    def get(self, *, parent_ref: str, child_id: str) -> ChildProfile | None: ...

    def list_for_parent(self, *, parent_ref: str) -> tuple[ChildProfile, ...]: ...

    def create(self, *, parent_ref: str, profile: ChildProfile) -> None: ...

    def save(self, *, parent_ref: str, profile: ChildProfile) -> None: ...

    def delete(self, *, parent_ref: str, child_id: str) -> None: ...


class ChallengeRepository(Protocol):
    """Acceso a retos emitidos, bajo la partición infantil (ADR-003)."""

    def get(self, *, child_id: str, challenge_id: str) -> Challenge | None: ...

    def create(self, *, child_id: str, challenge: Challenge) -> None: ...

    def save(self, *, child_id: str, challenge: Challenge) -> None: ...


class ProgressRepository(Protocol):
    """Acceso al resumen autoritativo de progreso de un perfil infantil."""

    def get(self, *, child_id: str) -> Progress: ...

    def save(self, *, child_id: str, progress: Progress) -> None: ...
