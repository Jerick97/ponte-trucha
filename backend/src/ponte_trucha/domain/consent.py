"""Regla pura de estados de consentimiento parental.

Sigue la máquina de estados de `autenticacion-consentimiento-parental/design.md`:

    [*] --> denied
    denied --> granted: decisión adulta
    granted --> revoked: revocación
    revoked --> granted: nuevo consentimiento
    granted --> denied: nueva política rechazada

Las finalidades opcionales (`serverSideAi`, `productAnalytics`) inician en
`denied`. `core` también inicia en `denied` hasta la primera decisión del
adulto: el aviso de privacidad se muestra antes de crear cualquier perfil.
"""

from __future__ import annotations

from dataclasses import dataclass, replace

from ponte_trucha.domain.errors import InvalidConsentTransitionError
from ponte_trucha.domain.value_objects import ConsentPurpose, ConsentState

_GRANTABLE_STATES = frozenset({ConsentState.DENIED, ConsentState.REVOKED})
_DENIABLE_STATES = frozenset({ConsentState.GRANTED, ConsentState.DENIED})


@dataclass(frozen=True, slots=True)
class ConsentRecord:
    """Decisión vigente de una finalidad, más su versión de política."""

    purpose: ConsentPurpose
    state: ConsentState
    policy_version: str
    method: str
    decided_at: str
    revision: int
    revoked_at: str | None = None

    @classmethod
    def initial(cls, purpose: ConsentPurpose, policy_version: str, now: str) -> ConsentRecord:
        """Estado por defecto antes de cualquier decisión del adulto."""

        return cls(
            purpose=purpose,
            state=ConsentState.DENIED,
            policy_version=policy_version,
            method="system-default",
            decided_at=now,
            revision=0,
        )

    def grant(self, *, policy_version: str, method: str, now: str) -> ConsentRecord:
        if self.state not in _GRANTABLE_STATES:
            raise InvalidConsentTransitionError(
                f"No se puede otorgar {self.purpose} desde el estado {self.state}."
            )
        return replace(
            self,
            state=ConsentState.GRANTED,
            policy_version=policy_version,
            method=method,
            decided_at=now,
            revoked_at=None,
            revision=self.revision + 1,
        )

    def deny(self, *, policy_version: str, method: str, now: str) -> ConsentRecord:
        if self.state not in _DENIABLE_STATES:
            raise InvalidConsentTransitionError(
                f"No se puede rechazar {self.purpose} desde el estado {self.state}."
            )
        return replace(
            self,
            state=ConsentState.DENIED,
            policy_version=policy_version,
            method=method,
            decided_at=now,
            revoked_at=None,
            revision=self.revision + 1,
        )

    def revoke(self, *, now: str) -> ConsentRecord:
        if self.state != ConsentState.GRANTED:
            raise InvalidConsentTransitionError(
                f"No se puede revocar {self.purpose} desde el estado {self.state}."
            )
        return replace(
            self,
            state=ConsentState.REVOKED,
            decided_at=now,
            revoked_at=now,
            revision=self.revision + 1,
        )

    def is_active_for(self, active_policy_version: str) -> bool:
        """Vigente solo si está otorgado y coincide con la política activa."""

        return self.state == ConsentState.GRANTED and self.policy_version == active_policy_version
