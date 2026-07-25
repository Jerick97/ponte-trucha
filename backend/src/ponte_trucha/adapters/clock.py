"""Adapter de tiempo: UTC en RFC 3339, como exige ADR-003."""

from __future__ import annotations

from datetime import UTC, datetime

from ponte_trucha.application.ports import Clock


class SystemClock(Clock):
    """Reloj real del sistema. Nunca se usa directamente en el dominio/tests."""

    def now(self) -> str:
        return datetime.now(UTC).isoformat(timespec="seconds").replace("+00:00", "Z")
