# Tareas — Backend serverless

> Plan de implementación para Kiro. El contrato HTTP del MVP está expuesto y
> probado; `Attempt`, sus casos de uso y adapters ya existen. Sigue pendiente
> convertir las escrituras secuenciales del intento en una única
> `TransactWriteItems`, habilitar Bedrock solo con retención cero demostrada e
> integrar el cliente TypeScript con el frontend de Jerick.

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

- [x] 7. Escribir tests rojos de Challenge/Attempt/Progress
  - _Requisitos: R3, R4_
  - _Verificado: `test_challenge.py`, `test_attempt.py` y `test_progress.py`._
- [x] 8. Implementar el mínimo y refactorizar dominio
  - _Requisitos: R3, R4_
  - _Verificado: `Challenge`, `Attempt` y `Progress`, incluidos expiración,
    doble respuesta y fórmula autoritativa de puntaje._
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
  - _Avance parcial: `ConversationReply` exige consentimiento
    `serverSideAi`, no persiste historial, detiene presión ante negativa y
    responde únicamente desde contenido curado. Bedrock y su cadena completa
    permanecen apagados por ADR-005._

## Fase 3 — Aplicación y adapters

- [x] 14. Implementar casos de uso con repositories falsos
  - _Requisitos: R2, R3, R4_
  - _Verificado: emisión, intento, progreso, cuenta, consentimiento, perfiles
    y borrado con repositories en memoria y pruebas de ownership/idempotencia._
- [x] 15. Crear adapters DynamoDB con contract tests
  - _Requisitos: R2_
  - _Verificado: repositories de cuenta, consentimiento, perfiles, retos,
    intentos, progreso e idempotencia con Stubber y sin `Scan`._
- [ ] 16. Implementar transacción e idempotencia del intento
  - _Requisitos: R4_
  - _Avance parcial: `POST /v1/retos/{challengeId}/intentos` funciona, la
    clave idempotente se guarda como digest HMAC y el replay fue probado en
    Floci. Falta agrupar Attempt + Challenge + Progress + Idempotency en una
    única `TransactWriteItems` como exige ADR-003._
- [ ] 17. Crear adapter Bedrock y pruebas de retención/guardrails
  - _Requisitos: R6_
- [x] 18. Crear entrypoint FastAPI/Web Adapter y tests HTTP
  - _Requisitos: R1, R7_
  - _Verificado: rutas de cuenta, consentimiento, perfiles, retos, intentos,
    progreso e IA curada; paridad OpenAPI/Terraform y puente ASGI exclusivo de
    Floci. El payload visible no filtra grading ni el tipo correcto._
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
  - _Avance: plan/apply completo en el emulador Floci de `dev`; AWS real no
    fue modificado._
- [ ] 22. Ejecutar integration/E2E y pruebas de seguridad en `dev`
  - _Requisitos: R1-R8_
  - _Avance: E2E en Floci cubre health, 401 sin token, cuenta, consentimiento,
    perfil, reto, intento, progreso y replay idempotente. Falta el gate contra
    AWS real y revisar rate limiting/logs operativos._

## Fase 5 — Integración

- [ ] 23. Generar/validar cliente TypeScript desde OpenAPI
  - _Requisitos: R7_
  - _Coordinación: toca contratos compartidos; avisar a Jerick_
- [ ] 24. Integrar el loop frontend con retos/intentos/progreso remoto
  - _Requisitos: R3, R4, R5_
  - _Coordinación: toca UI/store de Jerick y lógica de Clau_
- [ ] 25. Ejecutar gate de lanzamiento del PRD y actualizar documentación
  - _Requisitos: R1-R8_

Siguiente responsable: **Francis** en 3, 5 y 16. **Jerick** participa desde 23
sin que backend toque su frontend; **Clau** aprueba contratos de
escenarios/score antes de 24.
