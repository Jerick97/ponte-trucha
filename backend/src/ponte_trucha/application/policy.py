"""Versiones vigentes de las políticas que gobiernan age gate y consentimiento.

Un cambio material de política se refleja subiendo estas constantes. El caso
de uso `UpdateConsent` compara la versión enviada por el adulto contra
`CURRENT_PRIVACY_POLICY_VERSION`; una versión antigua produce
`PolicyVersionStaleError`.
"""

from __future__ import annotations

CURRENT_AGE_GATE_RULE_VERSION: str = "age-gate-v1"
CURRENT_PRIVACY_POLICY_VERSION: str = "politica-2026-07-v1"
