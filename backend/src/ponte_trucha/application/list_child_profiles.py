"""Caso de uso: listar los perfiles infantiles del adulto autenticado."""

from __future__ import annotations

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.ports import ChildProfileRepository
from ponte_trucha.domain.child_profile import ChildProfile


class ListChildProfiles:
    def __init__(self, *, profiles: ChildProfileRepository) -> None:
        self._profiles = profiles

    def execute(self, adult: AuthenticatedAdult) -> tuple[ChildProfile, ...]:
        all_profiles = self._profiles.list_for_parent(parent_ref=adult.parent_ref)
        return tuple(profile for profile in all_profiles if profile.is_active)
