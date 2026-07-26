"""Value objects compartidos del dominio.

Sin dependencias externas: solo tipos estándar de Python.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum

_MIN_DIFFICULTY = 1
_MAX_DIFFICULTY = 3


class AgeBand(StrEnum):
    """Banda etaria del perfil infantil: `8-10` o `11-13`."""

    EIGHT_TO_TEN = "8-10"
    ELEVEN_TO_THIRTEEN = "11-13"


class ProfileStatus(StrEnum):
    """Estado de un `ChildProfile`."""

    ACTIVE = "active"
    DELETING = "deleting"


class AccountStatus(StrEnum):
    """Estado de un `ParentAccount`."""

    ACTIVE = "active"
    DELETING = "deleting"


class ConsentPurpose(StrEnum):
    """Finalidad de una decisión de consentimiento."""

    CORE = "core"
    SERVER_SIDE_AI = "serverSideAi"
    PRODUCT_ANALYTICS = "productAnalytics"


class ConsentState(StrEnum):
    """Estado vigente de un `ConsentRecord`."""

    GRANTED = "granted"
    DENIED = "denied"
    REVOKED = "revoked"


# Catálogo cerrado de alias y avatares para perfiles infantiles. Ningún alias
# admite nombre real; ningún avatar es una foto. Ampliar el catálogo es una
# decisión de contenido (Clau) que agrega entradas aquí, nunca texto libre.
#
# Los ids son exactamente los que el frontend ofrece en
# `src/onboarding/perfilInfantil.ts` (`ALIAS_CATALOGO` y `AVATARES_CATALOGO`).
# Las etiquetas y emoji visibles viven allá; aquí solo se valida el id.
ALLOWED_ALIAS_IDS: frozenset[str] = frozenset(
    {
        "ojo-de-aguila",
        "trucha-veloz",
        "detective-cuy",
        "capitan-alerta",
        "rayo-andino",
        "zorro-listo",
        "tigre-atento",
        "buho-nocturno",
    }
)

ALLOWED_AVATAR_IDS: frozenset[str] = frozenset(
    {
        "aguila",
        "cuy",
        "zorro",
        "tigre",
        "buho",
        "llama",
        "pulpo",
        "rana",
    }
)

# Límite provisional del MVP para perfiles infantiles por adulto; ADR-003 lo
# marca como decisión diferida. Ajustar aquí, no en el caso de uso.
MAX_CHILD_PROFILES_PER_PARENT: int = 4


@dataclass(frozen=True, slots=True)
class Difficulty:
    """Nivel de dificultad del reto, entre 1 y 3 inclusive."""

    value: int

    def __post_init__(self) -> None:
        if not (_MIN_DIFFICULTY <= self.value <= _MAX_DIFFICULTY):
            raise ValueError(f"Dificultad fuera de rango: {self.value!r}")

    def step_up(self) -> Difficulty:
        return Difficulty(min(self.value + 1, _MAX_DIFFICULTY))

    def step_down(self) -> Difficulty:
        return Difficulty(max(self.value - 1, _MIN_DIFFICULTY))
