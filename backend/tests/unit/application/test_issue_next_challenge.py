from __future__ import annotations

from dataclasses import replace

import pytest

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.create_child_profile import (
    CreateChildProfile,
    CreateChildProfileCommand,
)
from ponte_trucha.application.get_or_create_account import GetOrCreateAccount
from ponte_trucha.application.issue_next_challenge import IssueNextChallenge
from ponte_trucha.application.ports import ScenarioGenerator
from ponte_trucha.application.update_consent import (
    ConsentDecision,
    UpdateConsent,
    UpdateConsentCommand,
)
from ponte_trucha.domain.challenge import MessageKind
from ponte_trucha.domain.channels import AppType
from ponte_trucha.domain.difficulty_strategy import StreakDifficultyStrategy
from ponte_trucha.domain.errors import (
    ConsentRequiredError,
    ProfileNotFoundError,
    ScenarioGenerationError,
)
from ponte_trucha.domain.guardrails import GuardrailChain, ScenarioRequest
from ponte_trucha.domain.scenario_bank import (
    CuratedScenario,
    ScammerProfile,
    ScenarioReveal,
    ScenarioSignal,
)
from ponte_trucha.domain.scenario_selection import (
    EligibilitySpecification,
    RoundRobinScenarioSelectionStrategy,
)
from ponte_trucha.domain.value_objects import AgeBand, ConsentPurpose, Difficulty

from .fakes import (
    FixedClock,
    InMemoryChildProfileRepository,
    InMemoryConsentRepository,
    InMemoryParentAccountRepository,
    SequentialIdGenerator,
)
from .in_memory_game_repositories import InMemoryChallengeRepository, InMemoryProgressRepository

ADULT = AuthenticatedAdult(parent_ref="ref-1", scopes=frozenset({"game.play"}))

_BANK = (
    CuratedScenario(
        scenario_id="escenario-1",
        scenario_version=1,
        app_type=AppType.SMS,
        difficulty=Difficulty(1),
        message_kind=MessageKind.TRAP,
        payload={"mensaje": "Ganaste, manda tu clave"},
        grading_signal_codes=("pide-clave",),
        grading_feedback_code="pide-clave-nunca",
        reveal=ScenarioReveal(
            scenario_type="robo-de-cuenta",
            signals=(ScenarioSignal(fragment="tu clave", explanation="Nadie te pide tu clave."),),
            lesson="Nadie que sea de verdad te pide tu clave.",
            allows_conversation=True,
            scammer_profile=ScammerProfile(
                disguise="admin del juego",
                tactics=("prisa",),
                objective="conseguir la clave",
            ),
        ),
    ),
    CuratedScenario(
        scenario_id="escenario-2",
        scenario_version=1,
        app_type=AppType.SMS,
        difficulty=Difficulty(1),
        message_kind=MessageKind.LEGITIMATE,
        payload={"mensaje": "Tu código es 123456, no lo compartas"},
        grading_signal_codes=(),
        grading_feedback_code="mensaje-informativo",
        reveal=ScenarioReveal(
            scenario_type="legitimo",
            signals=(
                ScenarioSignal(fragment="no lo compartas", explanation="Un aviso real te informa."),
            ),
            lesson="Un mensaje real te informa; uno falso te pide algo.",
            allows_conversation=False,
        ),
    ),
)

_GENERATED = CuratedScenario(
    scenario_id="ia-1",
    scenario_version=1,
    app_type=AppType.SMS,
    difficulty=Difficulty(1),
    message_kind=MessageKind.TRAP,
    payload={
        "canal": "sms",
        "dificultad": 1,
        "remitente": {"nombre": "PremiosYA", "avatar": "🎁", "verificado": False},
        "mensaje": "Ganaste monedas. Manda tu clave ahora para recibir el premio.",
    },
    grading_signal_codes=("manda-tu-clave",),
    grading_feedback_code="nadie-pide-tu-clave",
    reveal=ScenarioReveal(
        scenario_type="monedas-gratis",
        signals=(
            ScenarioSignal(
                fragment="Manda tu clave",
                explanation="Nadie que sea de verdad te pide tu clave.",
            ),
        ),
        lesson="Nadie regala monedas a cambio de tu clave.",
        allows_conversation=True,
        scammer_profile=ScammerProfile(
            disguise="alguien de premios",
            tactics=("prisa", "premio"),
            objective="conseguir la clave",
        ),
    ),
)


class RecordingScenarioGenerator(ScenarioGenerator):
    def __init__(
        self,
        *,
        scenario: CuratedScenario = _GENERATED,
        error: ScenarioGenerationError | None = None,
    ) -> None:
        self.scenario = scenario
        self.error = error
        self.requests: list[ScenarioRequest] = []

    def generate(self, *, request: ScenarioRequest, scenario_id: str) -> CuratedScenario:
        self.requests.append(request)
        if self.error is not None:
            raise self.error
        return replace(self.scenario, scenario_id=scenario_id)


def _bootstrap() -> tuple[
    InMemoryParentAccountRepository,
    InMemoryConsentRepository,
    InMemoryChildProfileRepository,
    str,
]:
    accounts = InMemoryParentAccountRepository()
    consents = InMemoryConsentRepository()
    profiles = InMemoryChildProfileRepository()
    clock = FixedClock()
    GetOrCreateAccount(accounts=accounts, consents=consents, clock=clock).execute(
        ADULT, age_gate_rule_version="age-gate-v1"
    )
    UpdateConsent(accounts=accounts, consents=consents, clock=clock).execute(
        ADULT,
        UpdateConsentCommand(
            purpose=ConsentPurpose.CORE,
            decision=ConsentDecision.GRANT,
            policy_version="politica-2026-07-v1",
            method="explicit-click",
        ),
    )
    profile = CreateChildProfile(
        accounts=accounts,
        consents=consents,
        profiles=profiles,
        ids=SequentialIdGenerator(),
        clock=clock,
    ).execute(
        ADULT,
        CreateChildProfileCommand(
            alias_id="zorro-listo", avatar_id="zorro", age_band=AgeBand.EIGHT_TO_TEN
        ),
    )
    return accounts, consents, profiles, profile.child_id


def _use_case(
    *,
    accounts: InMemoryParentAccountRepository,
    consents: InMemoryConsentRepository,
    profiles: InMemoryChildProfileRepository,
    challenges: InMemoryChallengeRepository,
    progresses: InMemoryProgressRepository,
    scenario_generator: ScenarioGenerator | None = None,
    bedrock_enabled: bool = False,
) -> IssueNextChallenge:
    return IssueNextChallenge(
        accounts=accounts,
        consents=consents,
        profiles=profiles,
        challenges=challenges,
        progresses=progresses,
        scenario_bank=_BANK,
        eligibility=EligibilitySpecification(),
        selection_strategy=RoundRobinScenarioSelectionStrategy(),
        difficulty_strategy=StreakDifficultyStrategy(),
        ids=SequentialIdGenerator(),
        clock=FixedClock(),
        random_value=lambda: 0.0,
        validity_minutes=30,
        scenario_generator=scenario_generator,
        guardrails=GuardrailChain.with_default_rules(),
        bedrock_enabled=bedrock_enabled,
    )


def _grant_server_side_ai(
    *,
    accounts: InMemoryParentAccountRepository,
    consents: InMemoryConsentRepository,
) -> None:
    UpdateConsent(accounts=accounts, consents=consents, clock=FixedClock()).execute(
        ADULT,
        UpdateConsentCommand(
            purpose=ConsentPurpose.SERVER_SIDE_AI,
            decision=ConsentDecision.GRANT,
            policy_version="politica-2026-07-v1",
            method="explicit-click",
        ),
    )


def test_issuing_a_challenge_hides_grading_and_returns_visible_payload_only() -> None:
    accounts, consents, profiles, child_id = _bootstrap()
    use_case = _use_case(
        accounts=accounts,
        consents=consents,
        profiles=profiles,
        challenges=InMemoryChallengeRepository(),
        progresses=InMemoryProgressRepository(),
    )

    challenge = use_case.execute(ADULT, child_id=child_id)

    visible = challenge.to_visible_payload()
    assert "grading" not in visible
    assert visible["challengeId"]
    assert visible["appType"] == "sms"


def test_issuing_a_challenge_requires_core_consent() -> None:
    accounts = InMemoryParentAccountRepository()
    profiles = InMemoryChildProfileRepository()
    consents = InMemoryConsentRepository()
    GetOrCreateAccount(accounts=accounts, consents=consents, clock=FixedClock()).execute(
        ADULT, age_gate_rule_version="age-gate-v1"
    )
    with pytest.raises(ConsentRequiredError):
        CreateChildProfile(
            accounts=accounts,
            consents=consents,
            profiles=profiles,
            ids=SequentialIdGenerator(),
            clock=FixedClock(),
        ).execute(
            ADULT,
            CreateChildProfileCommand(
                alias_id="zorro-listo", avatar_id="zorro", age_band=AgeBand.EIGHT_TO_TEN
            ),
        )


def test_issuing_a_challenge_for_a_profile_owned_by_another_adult_is_rejected() -> None:
    accounts, consents, profiles, child_id = _bootstrap()
    stranger = AuthenticatedAdult(parent_ref="ref-2", scopes=frozenset({"game.play"}))
    GetOrCreateAccount(accounts=accounts, consents=consents, clock=FixedClock()).execute(
        stranger, age_gate_rule_version="age-gate-v1"
    )
    use_case = _use_case(
        accounts=accounts,
        consents=consents,
        profiles=profiles,
        challenges=InMemoryChallengeRepository(),
        progresses=InMemoryProgressRepository(),
    )

    with pytest.raises(ProfileNotFoundError):
        use_case.execute(stranger, child_id=child_id)


def test_issuing_a_challenge_never_repeats_a_recently_seen_scenario() -> None:
    accounts, consents, profiles, child_id = _bootstrap()
    challenges = InMemoryChallengeRepository()
    progresses = InMemoryProgressRepository()
    use_case = _use_case(
        accounts=accounts,
        consents=consents,
        profiles=profiles,
        challenges=challenges,
        progresses=progresses,
    )

    first = use_case.execute(ADULT, child_id=child_id)
    progresses.save(
        child_id=child_id,
        progress=progresses.get(child_id=child_id).record_attempt(
            scenario_id=first.scenario_id,
            message_kind=first.message_kind,
            is_correct=True,
            points=10,
        ),
    )

    second = use_case.execute(ADULT, child_id=child_id)

    assert second.scenario_id != first.scenario_id


def test_bedrock_apagado_no_invoca_el_generador_aunque_haya_consentimiento() -> None:
    accounts, consents, profiles, child_id = _bootstrap()
    _grant_server_side_ai(accounts=accounts, consents=consents)
    generator = RecordingScenarioGenerator()
    use_case = _use_case(
        accounts=accounts,
        consents=consents,
        profiles=profiles,
        challenges=InMemoryChallengeRepository(),
        progresses=InMemoryProgressRepository(),
        scenario_generator=generator,
        bedrock_enabled=False,
    )

    challenge = use_case.execute(ADULT, child_id=child_id)

    assert challenge.scenario_id == "escenario-1"
    assert generator.requests == []


def test_bedrock_no_se_invoca_sin_consentimiento_vigente() -> None:
    accounts, consents, profiles, child_id = _bootstrap()
    generator = RecordingScenarioGenerator()
    use_case = _use_case(
        accounts=accounts,
        consents=consents,
        profiles=profiles,
        challenges=InMemoryChallengeRepository(),
        progresses=InMemoryProgressRepository(),
        scenario_generator=generator,
        bedrock_enabled=True,
    )

    challenge = use_case.execute(ADULT, child_id=child_id)

    assert challenge.scenario_id == "escenario-1"
    assert generator.requests == []


def test_usa_el_candidato_de_bedrock_solo_si_pasa_guardrails() -> None:
    accounts, consents, profiles, child_id = _bootstrap()
    _grant_server_side_ai(accounts=accounts, consents=consents)
    generator = RecordingScenarioGenerator()
    use_case = _use_case(
        accounts=accounts,
        consents=consents,
        profiles=profiles,
        challenges=InMemoryChallengeRepository(),
        progresses=InMemoryProgressRepository(),
        scenario_generator=generator,
        bedrock_enabled=True,
    )

    challenge = use_case.execute(ADULT, child_id=child_id)

    assert challenge.scenario_id.startswith("scenario-ai-")
    assert challenge.payload_snapshot["mensaje"].startswith("Ganaste monedas")
    assert len(generator.requests) == 1
    assert generator.requests[0].age_band is AgeBand.EIGHT_TO_TEN


def test_salida_insegura_de_bedrock_cae_al_banco_curado() -> None:
    accounts, consents, profiles, child_id = _bootstrap()
    _grant_server_side_ai(accounts=accounts, consents=consents)
    unsafe = replace(
        _GENERATED,
        payload={
            **_GENERATED.payload,
            "mensaje": "Mándame una foto sin ropa y te doy monedas gratis.",
        },
    )
    generator = RecordingScenarioGenerator(scenario=unsafe)
    use_case = _use_case(
        accounts=accounts,
        consents=consents,
        profiles=profiles,
        challenges=InMemoryChallengeRepository(),
        progresses=InMemoryProgressRepository(),
        scenario_generator=generator,
        bedrock_enabled=True,
    )

    challenge = use_case.execute(ADULT, child_id=child_id)

    assert challenge.scenario_id == "escenario-1"


def test_error_de_bedrock_cae_al_banco_curado() -> None:
    accounts, consents, profiles, child_id = _bootstrap()
    _grant_server_side_ai(accounts=accounts, consents=consents)
    generator = RecordingScenarioGenerator(error=ScenarioGenerationError())
    use_case = _use_case(
        accounts=accounts,
        consents=consents,
        profiles=profiles,
        challenges=InMemoryChallengeRepository(),
        progresses=InMemoryProgressRepository(),
        scenario_generator=generator,
        bedrock_enabled=True,
    )

    challenge = use_case.execute(ADULT, child_id=child_id)

    assert challenge.scenario_id == "escenario-1"
