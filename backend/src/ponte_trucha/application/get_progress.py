from __future__ import annotations

from dataclasses import dataclass

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.ports import ChildProfileRepository, ProgressRepository
from ponte_trucha.domain.errors import ProfileNotFoundError
from ponte_trucha.domain.progress import Progress


@dataclass(frozen=True, slots=True)
class GetProgress:
    profiles: ChildProfileRepository
    progresses: ProgressRepository

    def execute(self, adult: AuthenticatedAdult, *, child_id: str) -> Progress:
        profile = self.profiles.get(parent_ref=adult.parent_ref, child_id=child_id)
        if profile is None or not profile.is_active:
            raise ProfileNotFoundError()
        return self.progresses.get(child_id=child_id)
