# Tareas — Backend serverless

> Plan de implementación para Kiro. Las tareas 1, 2, 4, 6, 19 y 20 están
> completadas. 10.1 y 18.1 (catálogo `GET /v1/apps`) y el flujo de emisión de
> `GET /v1/perfiles/{childId}/retos/siguiente` (partes de 7, 8, 11, 12, 14, 15,
> 18) también están completos y verificados. La transacción de intento
> (`POST .../intentos`, tareas 13, 16, 17) sigue pendiente.

## Fase 0 — Decisiones y contrato

- [x] 1. Resolver ADR-001 a ADR-005 y registrar trade-offs
  - _Requisitos: R1, R2, R6, R8_
- [x] 2. Definir access patterns y diagrama físico DynamoDB
  - _Requisitos: R2, R4_
- [ ] 3. Diseñar OpenAPI 3.1 con ejemplos sanitizados y RFC 9457
  - _Requisitos: R7_

## Fase 1 — Setup con TDD

- [x] 4. Crear estructura backend y toolchain aprobada sin lógica
  - _Requisitos: R1, R7_
- [ ] 5. Configurar pytest, coverage, lint y type checking en CI
  - _Requisitos: R7_
- [x] 6. Escribir tests de arquitectura que impidan imports inválidos
  - _Requisitos: R7_

## Fase 2 — Dominio

- [ ] 7. Escribir tests rojos de Challenge/Attempt/Progress
  - _Requisitos: R3, R4_
  - _Avance parcial: `tests/unit/domain/test_challenge.py` y
    `test_progress.py` cubren `Challenge` y `Progress`. `Attempt` (necesario
    para `POST .../intentos`) no tiene tests todavía; no marcar completa._
- [ ] 8. Implementar el mínimo y refactorizar dominio
  - _Requisitos: R3, R4_
  - _Avance parcial: `domain/challenge.py` (`Challenge`, `Grading`,
    `MessageKind`, errores de expiración/doble respuesta) y
    `domain/progress.py` (`Progress.record_attempt`) implementados y en
    verde. `Attempt` pendiente._
- [ ] 9. Escribir tests rojos de factories para las cuatro apps
  - _Requisitos: R3_
  - _Nota: no se escribieron factories que construyan el payload completo por
    canal; el payload visible hoy sale directo del banco curado
    (`adapters/curated_scenario_bank.py`). Sigue pendiente si el equipo decide
    que cada canal necesita su propio constructor/validador además del
    catálogo de metadata de la tarea 10.1._
- [ ] 10. Implementar registry, factories y schemas
  - _Requisitos: R3_
  - _Ver nota de la tarea 9: `ScenarioFactoryRegistry` existe
    (`domain/channels.py`) pero sus factories hoy solo declaran metadata de
    catálogo, no construyen/validan payload por canal._
- [x] 10.1 Escribir tests rojos de `list_channels()` del registry (metadata sin
      escenarios, señales ni respuestas) e implementar el mínimo
  - _Requisitos: R3_
  - _Verificado: `tests/unit/domain/test_channels.py` (registry con las 4
    apps, orden de prioridad, error si falta factory) y
    `domain/channels.py`._
- [x] 11. Escribir tests de Strategy/Specification de adaptación
  - _Requisitos: R5_
  - _Verificado: `tests/unit/domain/test_scenario_selection.py` y
    `test_difficulty_strategy.py`._
- [x] 12. Implementar adaptación determinista y reason codes
  - _Requisitos: R5_
  - _Verificado: `domain/difficulty_strategy.py`
    (`StreakDifficultyStrategy`, reason codes `sustained_streak` /
    `repeated_errors` / `stable_performance`) y `domain/scenario_selection.py`
    (`EligibilitySpecification`, `RoundRobinScenarioSelectionStrategy`)._
- [ ] 13. Escribir e implementar guardrails con fallback curado
  - _Requisitos: R6_
  - _No iniciada: solo existe la fuente `curated`; no hay generación IA ni
    cadena de guardrails todavía._

## Fase 3 — Aplicación y adapters

- [ ] 14. Implementar casos de uso con repositories falsos
  - _Requisitos: R2, R3, R4_
  - _Avance parcial: `IssueNextChallenge` implementado y probado con fakes en
    `tests/unit/application/test_issue_next_challenge.py` (ownership,
    consentimiento, no repetición). Falta el caso de uso de intento
    (tarea 16)._
- [ ] 15. Crear adapters DynamoDB con contract tests
  - _Requisitos: R2_
  - _Avance parcial: `adapters/dynamodb_game_repositories.py`
    (`ChallengeDynamoDbRepository`, `ProgressDynamoDbRepository`) con
    contract tests en `tests/contract/test_dynamodb_game_repositories.py`
    (Stubber, sin `Scan`). Falta el repository de `Attempt` e idempotencia
    del intento._
- [ ] 16. Implementar transacción e idempotencia del intento
  - _Requisitos: R4_
  - _No iniciada: `POST /v1/retos/{challengeId}/intentos` no existe. El
    modelo actual de `Challenge`/`Progress` está listo para que esta tarea
    construya la `TransactWriteItems` de ADR-003 sobre él._
- [ ] 17. Crear adapter Bedrock y pruebas de retención/guardrails
  - _Requisitos: R6_
- [x] 18. Crear entrypoint FastAPI/Web Adapter y tests HTTP
  - _Requisitos: R1, R7_
  - _Verificado para el alcance actual: `GET /v1/perfiles/{child_id}/retos/
    siguiente` (scope `game.play`) en `routes_profiles.py`, con tests HTTP en
    `tests/unit/entrypoints/test_routes_next_challenge.py` (oculta `grading`,
    exige scope, IDOR entre dos adultos). `POST .../intentos` queda para la
    tarea 16; no marcar esta tarea como cerrando ese endpoint._
- [x] 18.1 Exponer `GET /v1/apps` público sobre `list_channels()`, con
      `Cache-Control` corto y tests HTTP que verifiquen que no filtra
      escenarios, señales ni respuestas correctas
  - _Requisitos: R3, R7_
  - _Verificado: `entrypoints/http/routes_apps.py` +
    `tests/unit/entrypoints/test_routes_apps.py`; ruta pública añadida a
    `infra/modules/api/main.tf` (`aws_apigatewayv2_route.apps_catalog`, sin
    JWT authorizer) y cubierta por `infra/modules/api/tests/api.tftest.hcl`._

## Fase 4 — Terraform y despliegue dev

- [x] 19. Crear módulos Terraform con tests para API, Lambda y DynamoDB
  - _Requisitos: R1, R2, R8_
- [x] 20. Aplicar IAM mínimo, límites, cifrado, TTL y logs con retención
  - _Requisitos: R2, R8_
- [ ] 21. Ejecutar plan revisado y desplegar únicamente a `dev`
  - _Requisitos: R8_
- [ ] 22. Ejecutar integration/E2E y pruebas de seguridad en `dev`
  - _Requisitos: R1-R8_

## Fase 5 — Integración

- [ ] 23. Generar/validar cliente TypeScript desde OpenAPI
  - _Requisitos: R7_
  - _Coordinación: toca contratos compartidos; avisar a Jerick_
- [ ] 24. Integrar el loop frontend con retos/intentos/progreso remoto
  - _Requisitos: R3, R4, R5_
  - _Coordinación: toca UI/store de Jerick y lógica de Clau_
- [ ] 25. Ejecutar gate de lanzamiento del PRD y actualizar documentación
  - _Requisitos: R1-R8_

Siguiente responsable: **Francis** en tarea 1. Jerick participa desde 23 y Clau
aprueba contratos de escenarios/score antes de 24.

