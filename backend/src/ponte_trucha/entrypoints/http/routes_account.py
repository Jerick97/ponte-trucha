"""Rutas de cuenta adulta y consentimiento (R2, R3)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from ponte_trucha.application.authenticated_adult import AuthenticatedAdult
from ponte_trucha.application.update_consent import UpdateConsentCommand
from ponte_trucha.domain.value_objects import ConsentPurpose
from ponte_trucha.entrypoints.http.auth import AdultDependency, require_scope
from ponte_trucha.entrypoints.http.composition import UseCases
from ponte_trucha.entrypoints.http.schemas import (
    BootstrapAccountRequest,
    ConsentResponse,
    ParentAccountResponse,
    UpdateConsentRequest,
)


def _use_cases(request: Request) -> UseCases:
    use_cases: UseCases = request.app.state.use_cases
    return use_cases


def register_account_routes(*, base_adult_dependency: AdultDependency) -> APIRouter:
    """Construye un router nuevo con las rutas y los scopes exigidos."""

    router = APIRouter(tags=["cuenta"])
    profiles_read = require_scope(base_adult_dependency, scope="profiles.read")
    consents_read = require_scope(base_adult_dependency, scope="consents.read")
    consents_write = require_scope(base_adult_dependency, scope="consents.write")

    @router.post("/v1/cuenta", response_model=ParentAccountResponse)
    def bootstrap_account(  # pyright: ignore[reportUnusedFunction]
        body: BootstrapAccountRequest,
        adult: AuthenticatedAdult = Depends(profiles_read),
        use_cases: UseCases = Depends(_use_cases),
    ) -> ParentAccountResponse:
        result = use_cases.get_or_create_account.execute(
            adult, age_gate_rule_version=body.age_gate_rule_version
        )
        return ParentAccountResponse.from_domain(result.account)

    @router.get("/v1/consentimientos", response_model=list[ConsentResponse])
    def get_consents(  # pyright: ignore[reportUnusedFunction]
        adult: AuthenticatedAdult = Depends(consents_read),
        use_cases: UseCases = Depends(_use_cases),
    ) -> list[ConsentResponse]:
        records = use_cases.get_consents.execute(adult)
        return [ConsentResponse.from_domain(record) for record in records]

    @router.patch("/v1/consentimientos/{purpose}", response_model=ConsentResponse)
    def update_consent(  # pyright: ignore[reportUnusedFunction]
        purpose: ConsentPurpose,
        body: UpdateConsentRequest,
        adult: AuthenticatedAdult = Depends(consents_write),
        use_cases: UseCases = Depends(_use_cases),
    ) -> ConsentResponse:
        command = UpdateConsentCommand(
            purpose=purpose,
            decision=body.decision,
            policy_version=body.policy_version,
            method=body.method,
        )
        record = use_cases.update_consent.execute(adult, command)
        return ConsentResponse.from_domain(record)

    return router
