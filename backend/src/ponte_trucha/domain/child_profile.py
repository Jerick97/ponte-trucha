"""Entidad de perfil infantil. Nunca contiene PII del niño."""

from __future__ import annotations

from dataclasses import dataclass, replace

from ponte_trucha.domain.errors import InvalidProfileSelectionError
from ponte_trucha.domain.value_objects import (
    ALLOWED_ALIAS_IDS,
    ALLOWED_AVATAR_IDS,
    AgeBand,
    ProfileStatus,
)


@dataclass(frozen=True, slots=True)
class ChildProfile:
    """Perfil infantil identificado por `child_id`, sin credenciales propias."""

    child_id: str
    alias_id: str
    avatar_id: str
    age_band: AgeBand
    created_at: str
    updated_at: str
    revision: int
    status: ProfileStatus = ProfileStatus.ACTIVE

    @classmethod
    def create(
        cls,
        *,
        child_id: str,
        alias_id: str,
        avatar_id: str,
        age_band: AgeBand,
        now: str,
    ) -> ChildProfile:
        _validate_catalog_selection(alias_id=alias_id, avatar_id=avatar_id)
        return cls(
            child_id=child_id,
            alias_id=alias_id,
            avatar_id=avatar_id,
            age_band=age_band,
            created_at=now,
            updated_at=now,
            revision=0,
        )

    def rename(self, *, alias_id: str, avatar_id: str, now: str) -> ChildProfile:
        _validate_catalog_selection(alias_id=alias_id, avatar_id=avatar_id)
        return replace(
            self,
            alias_id=alias_id,
            avatar_id=avatar_id,
            updated_at=now,
            revision=self.revision + 1,
        )

    def mark_deleting(self, *, now: str) -> ChildProfile:
        return replace(
            self,
            status=ProfileStatus.DELETING,
            updated_at=now,
            revision=self.revision + 1,
        )

    @property
    def is_active(self) -> bool:
        return self.status == ProfileStatus.ACTIVE


def _validate_catalog_selection(*, alias_id: str, avatar_id: str) -> None:
    if alias_id not in ALLOWED_ALIAS_IDS:
        raise InvalidProfileSelectionError(f"alias_id fuera de catálogo: {alias_id}")
    if avatar_id not in ALLOWED_AVATAR_IDS:
        raise InvalidProfileSelectionError(f"avatar_id fuera de catálogo: {avatar_id}")
