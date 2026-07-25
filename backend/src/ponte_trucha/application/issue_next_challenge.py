"""Caso de uso: emitir el siguiente reto para un perfil infantil (R3, R5).

Cubre `GET /v1/perfiles/{childId}/retos/siguiente`. El backend, no el
frontend, elige canal/dificultad/escenario: aplica `EligibilitySpecification`
para descartar candidatos repetidos o de dificultad distinta a la vigente,
`ScenarioSelectionStrategy` para evitar monotonía trampa/confianza, y
`DifficultyStrategy` para decidir el nivel de la ronda antes de filtrar.

Fuente de escenarios: el banco curado (`scenario_bank`), inyectado como
secuencia inmutable de `CuratedScenario`. La generación con IA/Bedrock
(tarea 17) es un `ScenarioSource` adicional que se conecta después sin
cambiar este caso de uso, seleccionando la fuente antes de construir el
`Challenge` (R3: "si la IA no está consentida, disponible o validada, usar el
banco curado").
"""

from __future__ import annotations

from collections.abc import Callable, Sequence
from dataclasses import dataclass, replace
from datetime import UTC, datetime, timedelta

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.policy import CURRENT_PRIVACY_POLICY_VERSION
from ponte_trucha.application.ports import (
    ChallengeRepository,
    ChildProfileRepository,
    Clock,
    ConsentRepository,
    IdGenerator,
    ParentAccountRepository,
    ProgressRepository,
)
from ponte_trucha.domain.challenge import Challenge, Grading, MessageKind
from ponte_trucha.domain.difficulty_strategy import DifficultyStrategy
from ponte_trucha.domain.errors import (
    AccountNotFoundError,
    ConsentRequiredError,
    NoEligibleScenarioError,
    ProfileNotFoundError,
)
from ponte_trucha.domain.progress import Progress
from ponte_trucha.domain.scenario_bank import CuratedScenario
from ponte_trucha.domain.scenario_selection import (
    EligibilitySpecification,
    ScenarioSelectionStrategy,
)
from ponte_trucha.domain.value_objects import ConsentPurpose, Difficulty

_DEFAULT_VALIDITY_MINUTES = 30


@dataclass(frozen=True, slots=True)
class IssueNextChallenge:
    accounts: ParentAccountRepository
    consents: ConsentRepository
    profiles: ChildProfileRepository
    challenges: ChallengeRepository
    progresses: ProgressRepository
    scenario_bank: Sequence[CuratedScenario]
    eligibility: EligibilitySpecification
    selection_strategy: ScenarioSelectionStrategy
    difficulty_strategy: DifficultyStrategy
    ids: IdGenerator
    clock: Clock
    random_value: Callable[[], float]
    validity_minutes: int = _DEFAULT_VALIDITY_MINUTES

    def execute(self, adult: AuthenticatedAdult, *, child_id: str) -> Challenge:
        account = self.accounts.get(parent_ref=adult.parent_ref)
        if account is None:
            raise AccountNotFoundError("La cuenta adulta no está provisionada.")
        account.require_active()

        profile = self.profiles.get(parent_ref=adult.parent_ref, child_id=child_id)
        if profile is None or not profile.is_active:
            raise ProfileNotFoundError("El perfil no existe o no pertenece a este adulto.")

        core_consent = self.consents.get(parent_ref=adult.parent_ref, purpose=ConsentPurpose.CORE)
        if core_consent is None or not core_consent.is_active_for(CURRENT_PRIVACY_POLICY_VERSION):
            raise ConsentRequiredError("Se requiere consentimiento core vigente.")

        progress = self.progresses.get(child_id=child_id)
        difficulty_decision = self.difficulty_strategy.next_difficulty(progress)
        progress_at_target_difficulty = _at_difficulty(progress, difficulty_decision.difficulty)

        candidates = tuple(
            scenario
            for scenario in self.scenario_bank
            if self.eligibility.is_satisfied_by(
                scenario, progress=progress_at_target_difficulty, age_band=profile.age_band
            )
        )
        if not candidates:
            raise NoEligibleScenarioError(
                "No hay escenarios elegibles para la dificultad y el historial actuales."
            )

        chosen = self.selection_strategy.select(
            candidates, progress=progress_at_target_difficulty, random_value=self.random_value()
        )

        now_dt = datetime.now(UTC)
        issued_at = self.clock.now()
        valid_until_dt = now_dt + timedelta(minutes=self.validity_minutes)

        challenge = Challenge(
            challenge_id=self.ids.new_id(prefix="challenge"),
            scenario_id=chosen.scenario_id,
            scenario_version=chosen.scenario_version,
            app_type=chosen.app_type,
            difficulty=chosen.difficulty,
            message_kind=MessageKind(chosen.message_kind),
            payload_snapshot=dict(chosen.payload),
            grading=Grading(
                decision=MessageKind(chosen.message_kind),
                signal_codes=chosen.grading_signal_codes,
                feedback_code=chosen.grading_feedback_code,
            ),
            issued_at=_parse_rfc3339(issued_at),
            valid_until=valid_until_dt,
        )
        self.challenges.create(parent_ref=adult.parent_ref, child_id=child_id, challenge=challenge)
        if progress_at_target_difficulty is not progress:
            self.progresses.save(child_id=child_id, progress=progress_at_target_difficulty)

        return challenge


def _at_difficulty(progress: Progress, difficulty: Difficulty) -> Progress:
    if progress.current_difficulty == difficulty:
        return progress
    return replace(progress, current_difficulty=difficulty)


def _parse_rfc3339(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))
