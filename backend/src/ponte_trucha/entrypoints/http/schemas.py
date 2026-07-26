"""DTO Pydantic del borde HTTP. `camelCase` hacia afuera (estandares-de-codigo.md).

Estos modelos son la única capa que conoce Pydantic; el dominio y la
aplicación reciben/devuelven dataclasses puras.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from ponte_trucha.application.submit_attempt import AttemptResult
from ponte_trucha.application.update_consent import ConsentDecision
from ponte_trucha.domain.attempt import ResponseTimeBucket
from ponte_trucha.domain.challenge import Challenge, MessageKind
from ponte_trucha.domain.channels import ChannelInfo
from ponte_trucha.domain.child_profile import ChildProfile
from ponte_trucha.domain.consent import ConsentRecord
from ponte_trucha.domain.parent_account import ParentAccount
from ponte_trucha.domain.progress import Progress
from ponte_trucha.domain.value_objects import AgeBand, ConsentPurpose


def _camel_case(field_name: str) -> str:
    first, *rest = field_name.split("_")
    return first + "".join(word.capitalize() for word in rest)


class _CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=_camel_case, populate_by_name=True)


class ParentAccountResponse(_CamelModel):
    status: str
    age_gate_rule_version: str
    profile_count: int
    created_at: str
    updated_at: str

    @classmethod
    def from_domain(cls, account: ParentAccount) -> ParentAccountResponse:
        return cls(
            status=account.status.value,
            age_gate_rule_version=account.age_gate_rule_version,
            profile_count=account.profile_count,
            created_at=account.created_at,
            updated_at=account.updated_at,
        )


class BootstrapAccountRequest(_CamelModel):
    """El frontend descarta la fecha tras calcular el gate; solo envía la versión."""

    age_gate_rule_version: str = Field(min_length=1, max_length=64)


class ConsentResponse(_CamelModel):
    purpose: ConsentPurpose
    state: str
    policy_version: str
    decided_at: str
    revoked_at: str | None = None

    @classmethod
    def from_domain(cls, record: ConsentRecord) -> ConsentResponse:
        return cls(
            purpose=record.purpose,
            state=record.state.value,
            policy_version=record.policy_version,
            decided_at=record.decided_at,
            revoked_at=record.revoked_at,
        )


class UpdateConsentRequest(_CamelModel):
    decision: ConsentDecision
    policy_version: str = Field(min_length=1, max_length=64)
    method: str = Field(min_length=1, max_length=64)


class PutConsentRequest(UpdateConsentRequest):
    purpose: ConsentPurpose


class ChildProfileResponse(_CamelModel):
    child_id: str
    alias_id: str
    avatar_id: str
    age_band: AgeBand
    created_at: str
    updated_at: str

    @classmethod
    def from_domain(cls, profile: ChildProfile) -> ChildProfileResponse:
        return cls(
            child_id=profile.child_id,
            alias_id=profile.alias_id,
            avatar_id=profile.avatar_id,
            age_band=profile.age_band,
            created_at=profile.created_at,
            updated_at=profile.updated_at,
        )


class CreateChildProfileRequest(_CamelModel):
    alias_id: str = Field(min_length=1, max_length=64)
    avatar_id: str = Field(min_length=1, max_length=64)
    age_band: AgeBand


class UpdateChildProfileRequest(_CamelModel):
    alias_id: str = Field(min_length=1, max_length=64)
    avatar_id: str = Field(min_length=1, max_length=64)


class ChildProfileListResponse(_CamelModel):
    profiles: tuple[ChildProfileResponse, ...]


class ChannelResponse(_CamelModel):
    """Metadata pública de un canal. Nunca incluye escenarios ni respuestas."""

    app_type: str
    display_name: str
    icon_key: str

    @classmethod
    def from_domain(cls, channel: ChannelInfo) -> ChannelResponse:
        return cls(
            app_type=channel.app_type.value,
            display_name=channel.display_name,
            icon_key=channel.icon_key,
        )


class NextChallengeResponse(_CamelModel):
    """Reto visible: nunca incluye `grading` ni la decisión correcta."""

    challenge_id: str
    app_type: str
    difficulty: int
    payload: dict[str, object]
    valid_until: str

    @classmethod
    def from_domain(cls, challenge: Challenge) -> NextChallengeResponse:
        visible = challenge.to_visible_payload()
        return cls(
            challenge_id=visible["challengeId"],
            app_type=visible["appType"],
            difficulty=visible["difficulty"],
            payload=visible["payload"],
            valid_until=visible["validUntil"],
        )


class SubmitAttemptRequest(_CamelModel):
    decision: MessageKind
    response_time_bucket: ResponseTimeBucket = ResponseTimeBucket.UNKNOWN


class SignalResponse(_CamelModel):
    """Señal delatora legible. Solo viaja con el resultado del intento."""

    fragment: str
    explanation: str


class ScammerProfileResponse(_CamelModel):
    disguise: str
    tactics: tuple[str, ...]
    objective: str


class AttemptResultResponse(_CamelModel):
    attempt_id: str
    challenge_id: str
    is_correct: bool
    points_awarded: int
    score: int
    streak: int
    total_attempts: int
    correct_attempts: int
    current_difficulty: int
    signal_codes: tuple[str, ...]
    feedback_code: str
    # Revelación educativa: el cliente la recibe recién al responder, nunca en
    # el GET del reto.
    correct_decision: MessageKind
    scenario_type: str
    signals: tuple[SignalResponse, ...]
    lesson: str
    allows_conversation: bool
    scammer_profile: ScammerProfileResponse | None = None

    @classmethod
    def from_result(cls, result: AttemptResult) -> AttemptResultResponse:
        reveal = result.reveal
        profile = reveal.scammer_profile
        return cls(
            attempt_id=result.attempt_id,
            challenge_id=result.challenge_id,
            is_correct=result.is_correct,
            points_awarded=result.points_awarded,
            score=result.score,
            streak=result.streak,
            total_attempts=result.total_attempts,
            correct_attempts=result.correct_attempts,
            current_difficulty=result.current_difficulty,
            signal_codes=result.signal_codes,
            feedback_code=result.feedback_code,
            correct_decision=result.correct_decision,
            scenario_type=reveal.scenario_type,
            signals=tuple(
                SignalResponse(fragment=signal.fragment, explanation=signal.explanation)
                for signal in reveal.signals
            ),
            lesson=reveal.lesson,
            allows_conversation=reveal.allows_conversation,
            scammer_profile=(
                None
                if profile is None
                else ScammerProfileResponse(
                    disguise=profile.disguise,
                    tactics=profile.tactics,
                    objective=profile.objective,
                )
            ),
        )


class ProgressResponse(_CamelModel):
    score: int
    streak: int
    total_attempts: int
    correct_attempts: int
    current_difficulty: int

    @classmethod
    def from_domain(cls, progress: Progress) -> ProgressResponse:
        return cls(
            score=progress.score,
            streak=progress.streak,
            total_attempts=progress.total_attempts,
            correct_attempts=progress.correct_attempts,
            current_difficulty=progress.current_difficulty.value,
        )
