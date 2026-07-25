"""Composición/DI: el único lugar que elige implementaciones concretas.

Sigue `arquitectura.md`: "La composición/DI es el único lugar que elige
implementaciones concretas." Lee variables de entorno una sola vez al crear la
app y construye los adapters (DynamoDB si `DOMAIN_TABLE_NAME` está presente,
memoria en caso contrario) más los casos de uso que usan las rutas.
"""

from __future__ import annotations

import base64
import binascii
import os
import random
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any, Protocol, cast

import boto3

from ponte_trucha.adapters.clock import SystemClock
from ponte_trucha.adapters.curated_scenario_bank import load_curated_scenario_bank
from ponte_trucha.adapters.dynamodb_game_repositories import (
    AttemptDynamoDbRepository,
    ChallengeDynamoDbRepository,
    ProgressDynamoDbRepository,
)
from ponte_trucha.adapters.dynamodb_idempotency import DynamoDbIdempotencyStore
from ponte_trucha.adapters.dynamodb_repositories import (
    ChildProfileDynamoDbRepository,
    ConsentDynamoDbRepository,
    ParentAccountDynamoDbRepository,
)
from ponte_trucha.adapters.id_generator import SecureIdGenerator
from ponte_trucha.adapters.in_memory_repositories import (
    InMemoryAttemptRepository,
    InMemoryChallengeRepository,
    InMemoryChildProfileRepository,
    InMemoryConsentRepository,
    InMemoryIdempotencyStore,
    InMemoryParentAccountRepository,
    InMemoryProgressRepository,
)
from ponte_trucha.adapters.parent_ref import HmacParentRefDeriver
from ponte_trucha.application.conversation_reply import ConversationReply
from ponte_trucha.application.create_child_profile import CreateChildProfile
from ponte_trucha.application.delete_adult_account import DeleteAdultAccount
from ponte_trucha.application.delete_child_profile import DeleteChildProfile
from ponte_trucha.application.delete_child_profile_data import DeleteChildProfileData
from ponte_trucha.application.get_account import GetAccount
from ponte_trucha.application.get_child_profile import GetChildProfile
from ponte_trucha.application.get_consents import GetConsents
from ponte_trucha.application.get_or_create_account import GetOrCreateAccount
from ponte_trucha.application.get_progress import GetProgress
from ponte_trucha.application.idempotency import IdempotencyStore
from ponte_trucha.application.issue_next_challenge import IssueNextChallenge
from ponte_trucha.application.list_child_profiles import ListChildProfiles
from ponte_trucha.application.ports import (
    AttemptRepository,
    ChallengeRepository,
    ChildProfileRepository,
    Clock,
    ConsentRepository,
    IdGenerator,
    ParentAccountRepository,
    ParentRefDeriver,
    ProgressRepository,
)
from ponte_trucha.application.submit_attempt import SubmitAttempt
from ponte_trucha.application.update_child_profile import UpdateChildProfile
from ponte_trucha.application.update_consent import UpdateConsent
from ponte_trucha.application.update_consent_idempotently import UpdateConsentIdempotently
from ponte_trucha.domain.channels import ScenarioFactoryRegistry
from ponte_trucha.domain.difficulty_strategy import StreakDifficultyStrategy
from ponte_trucha.domain.scenario_selection import (
    EligibilitySpecification,
    RoundRobinScenarioSelectionStrategy,
)

_HMAC_SECRET_ENV = "PARENT_REF_HMAC_SECRET"  # pragma: allowlist secret
_HMAC_SECRET_ARN_ENV = "HMAC_SECRET_ARN"
_HMAC_KEY_VERSION_ENV = "PARENT_REF_HMAC_KEY_VERSION"
_DOMAIN_TABLE_ENV = "DOMAIN_TABLE_NAME"
_IDEMPOTENCY_TABLE_ENV = "IDEMPOTENCY_TABLE_NAME"

# Solo para desarrollo local sin Secrets Manager. Nunca se usa si
# PARENT_REF_HMAC_SECRET está definido (Lambda real siempre lo define).
_DEV_ONLY_DEFAULT_SECRET = b"ponte-trucha-dev-secret-nunca-usar-en-produccion"


class _SecretsManagerClient(Protocol):
    def get_secret_value(self, *, SecretId: str) -> Mapping[str, object]: ...


@dataclass(frozen=True, slots=True)
class UseCases:
    """Casos de uso de cuenta, consentimiento y perfiles ya inyectados."""

    get_or_create_account: GetOrCreateAccount
    get_account: GetAccount
    get_consents: GetConsents
    update_consent: UpdateConsentIdempotently
    create_child_profile: CreateChildProfile
    get_child_profile: GetChildProfile
    list_child_profiles: ListChildProfiles
    update_child_profile: UpdateChildProfile
    delete_child_profile: DeleteChildProfileData
    delete_adult_account: DeleteAdultAccount
    get_progress: GetProgress
    issue_next_challenge: IssueNextChallenge
    submit_attempt: SubmitAttempt
    conversation_reply: ConversationReply
    channel_registry: ScenarioFactoryRegistry


def _decode_base64_secret(raw_secret: str) -> bytes:
    try:
        secret_key = base64.b64decode(raw_secret, validate=True)
    except (binascii.Error, ValueError) as error:
        raise RuntimeError("El secreto HMAC no contiene base64 válido.") from error
    if not secret_key:
        raise RuntimeError("El secreto HMAC no puede estar vacío.")
    return secret_key


def _load_hmac_secret() -> bytes:
    raw_secret = os.environ.get(_HMAC_SECRET_ENV)
    if raw_secret:
        return _decode_base64_secret(raw_secret)

    secret_arn = os.environ.get(_HMAC_SECRET_ARN_ENV)
    if secret_arn:
        # boto3 no publica stubs oficiales sin una dependencia adicional. El
        # `cast` confina esa frontera dinámica al protocolo mínimo requerido.
        secrets_manager = cast(
            "_SecretsManagerClient",
            boto3.client("secretsmanager"),  # pyright: ignore[reportUnknownMemberType]
        )
        response = secrets_manager.get_secret_value(SecretId=secret_arn)
        secret_string = response.get("SecretString")
        if isinstance(secret_string, str):
            return _decode_base64_secret(secret_string)
        secret_binary = response.get("SecretBinary")
        if isinstance(secret_binary, bytes) and secret_binary:
            return secret_binary
        raise RuntimeError("Secrets Manager no devolvió un secreto HMAC utilizable.")

    if os.environ.get(_DOMAIN_TABLE_ENV):
        raise RuntimeError("El modo persistente requiere configurar el secreto HMAC.")
    return _DEV_ONLY_DEFAULT_SECRET


def _build_parent_ref_deriver() -> ParentRefDeriver:
    secret_key = _load_hmac_secret()
    key_version = os.environ.get(_HMAC_KEY_VERSION_ENV, "dev-v1")
    return HmacParentRefDeriver(secret_key=secret_key, key_version=key_version)


def _build_repositories() -> tuple[
    ParentAccountRepository,
    ConsentRepository,
    ChildProfileRepository,
    ChallengeRepository,
    ProgressRepository,
    AttemptRepository,
    IdempotencyStore,
]:
    table_name = os.environ.get(_DOMAIN_TABLE_ENV)
    if table_name is None:
        return (
            InMemoryParentAccountRepository(),
            InMemoryConsentRepository(),
            InMemoryChildProfileRepository(),
            InMemoryChallengeRepository(),
            InMemoryProgressRepository(),
            InMemoryAttemptRepository(),
            InMemoryIdempotencyStore(),
        )

    # boto3 no publica stubs oficiales sin agregar `mypy-boto3-dynamodb`
    # (nueva dependencia, requiere acuerdo del equipo); se documenta la
    # frontera dinámica en este único punto en vez de propagar `Any`.
    dynamodb_resource: Any = boto3.resource(  # pyright: ignore[reportUnknownMemberType]
        "dynamodb"
    )
    table: Any = dynamodb_resource.Table(table_name)
    idempotency_table_name = os.environ.get(_IDEMPOTENCY_TABLE_ENV)
    if idempotency_table_name is None:
        raise RuntimeError("El modo persistente requiere IDEMPOTENCY_TABLE_NAME.")
    idempotency_table: Any = dynamodb_resource.Table(idempotency_table_name)
    secret_key = _load_hmac_secret()
    return (
        ParentAccountDynamoDbRepository(table),
        ConsentDynamoDbRepository(table),
        ChildProfileDynamoDbRepository(table),
        ChallengeDynamoDbRepository(table),
        ProgressDynamoDbRepository(table),
        AttemptDynamoDbRepository(table),
        DynamoDbIdempotencyStore(idempotency_table, secret_key=secret_key),
    )


def build_use_cases() -> UseCases:
    """Construye los casos de uso. `create_app()` la llama una sola vez y
    guarda el resultado en `app.state`, para no recomputar por request pero
    sin cachear entre apps distintas (necesario para pruebas aisladas)."""

    (
        accounts,
        consents,
        profiles,
        challenges,
        progresses,
        attempts,
        idempotency,
    ) = _build_repositories()
    clock: Clock = SystemClock()
    ids: IdGenerator = SecureIdGenerator()

    return UseCases(
        get_or_create_account=GetOrCreateAccount(accounts=accounts, consents=consents, clock=clock),
        get_account=GetAccount(accounts=accounts),
        get_consents=GetConsents(accounts=accounts, consents=consents),
        update_consent=UpdateConsentIdempotently(
            update_consent=UpdateConsent(accounts=accounts, consents=consents, clock=clock),
            idempotency=idempotency,
            clock=clock,
        ),
        create_child_profile=CreateChildProfile(
            accounts=accounts, consents=consents, profiles=profiles, ids=ids, clock=clock
        ),
        get_child_profile=GetChildProfile(profiles=profiles),
        list_child_profiles=ListChildProfiles(profiles=profiles),
        update_child_profile=UpdateChildProfile(accounts=accounts, profiles=profiles, clock=clock),
        delete_child_profile=DeleteChildProfileData(
            delete_profile=DeleteChildProfile(accounts=accounts, profiles=profiles, clock=clock),
            challenges=challenges,
            attempts=attempts,
            progresses=progresses,
            idempotency=idempotency,
            clock=clock,
        ),
        delete_adult_account=DeleteAdultAccount(
            accounts=accounts,
            consents=consents,
            profiles=profiles,
            challenges=challenges,
            attempts=attempts,
            progresses=progresses,
            idempotency=idempotency,
            clock=clock,
        ),
        get_progress=GetProgress(profiles=profiles, progresses=progresses),
        issue_next_challenge=IssueNextChallenge(
            accounts=accounts,
            consents=consents,
            profiles=profiles,
            challenges=challenges,
            progresses=progresses,
            scenario_bank=load_curated_scenario_bank(),
            eligibility=EligibilitySpecification(),
            selection_strategy=RoundRobinScenarioSelectionStrategy(),
            difficulty_strategy=StreakDifficultyStrategy(),
            ids=ids,
            clock=clock,
            random_value=random.random,
        ),
        submit_attempt=SubmitAttempt(
            accounts=accounts,
            consents=consents,
            profiles=profiles,
            challenges=challenges,
            attempts=attempts,
            progresses=progresses,
            idempotency=idempotency,
            ids=ids,
            clock=clock,
        ),
        conversation_reply=ConversationReply(accounts=accounts, consents=consents),
        channel_registry=ScenarioFactoryRegistry.with_default_channels(),
    )


def build_parent_ref_deriver() -> ParentRefDeriver:
    return _build_parent_ref_deriver()
