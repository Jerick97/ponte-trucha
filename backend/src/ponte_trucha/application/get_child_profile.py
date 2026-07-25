from __future__ import annotations

from dataclasses import dataclass

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.ports import ChildProfileRepository
from ponte_trucha.domain.child_profile import ChildProfile
from ponte_trucha.domain.errors import ProfileNotFoundError


@dataclass(frozen=True, slots=True)
class GetChildProfile:
    profiles: ChildProfileRepository

    def execute(self, adult: AuthenticatedAdult, *, child_id: str) -> ChildProfile:
        profile = self.profiles.get(parent_ref=adult.parent_ref, child_id=child_id)
        if profile is None or not profile.is_active:
            raise ProfileNotFoundError()
        return profile
