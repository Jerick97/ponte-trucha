# Tareas — Autenticación y consentimiento parental

> Ejecutar con TDD; no marcar sin verificación.

- [ ] 1. Aprobar ADR de sesión Cognito para SPA y threat model de tokens
  - _Requisitos: R2, R6_
  - _Nota: ADR-002 (`backend-serverless/adr/`) ya cubre la sesión Cognito. El
    threat model de tokens explícito sigue pendiente._
- [ ] 2. Definir con asesoría legal el método de consentimiento verificable
  - _Requisitos: R1, R3_
- [x] 3. Escribir primero tests de dominio para estados/versiones de consentimiento
  - _Requisitos: R3_
  - _Verificado: `tests/unit/domain/test_consent.py` (8 tests, incluye
    transiciones inválidas y vigencia por versión de política)._
- [x] 4. Implementar el modelo de consentimiento hasta pasar los tests
  - _Requisitos: R3_
  - _Verificado: `domain/consent.py` (`ConsentRecord`), casos de uso
    `GetOrCreateAccount`, `GetConsents`, `UpdateConsent` con tests propios._
- [x] 5. Escribir tests de ownership con dos cuentas y perfiles cruzados
  - _Requisitos: R4, R6_
  - _Verificado: `tests/unit/application/test_child_profile_ownership.py`
    (dominio/aplicación) y `tests/unit/entrypoints/test_routes_profiles.py`
    (HTTP end-to-end) prueban que un perfil ajeno y uno inexistente devuelven
    el mismo `PROFILE_NOT_FOUND`._
- [x] 6. Implementar casos de uso y repositories de perfiles
  - _Requisitos: R4_
  - _Verificado: `CreateChildProfile`, `ListChildProfiles`,
    `UpdateChildProfile`, `DeleteChildProfile`; repositories en memoria
    (`adapters/in_memory_repositories.py`) y DynamoDB
    (`adapters/dynamodb_repositories.py`) con contract tests vía
    `botocore.stub.Stubber` (sin Scan). Nota: `DeleteChildProfile` borra el
    `ChildProfile` y ajusta `profileCount`; el workflow completo de
    `DeletionJob`/cursor de ADR-003 queda para la tarea 10._
- [x] 7. Definir contratos OpenAPI de cuenta, consentimiento y perfiles
  - _Requisitos: R2, R3, R4_
  - _Verificado: rutas FastAPI (`entrypoints/http/routes_account.py`,
    `routes_profiles.py`) con DTO `camelCase`, errores RFC 9457 y
    `test_infrastructure_contract.py` que exige paridad exacta entre OpenAPI
    y las rutas de `infra/modules/api`._
- [x] 8. Crear Cognito y JWT authorizer mediante Terraform con tests
  - _Requisitos: R2, R6_
- [ ] 9. Integrar onboarding adulto y sesión con el frontend
  - _Requisitos: R1, R2, R3_
  - _Coordinación: toca UI de Jerick y estado compartido; avisar antes_
- [ ] 10. Implementar revocación, borrado y sus pruebas de integración
  - _Requisitos: R3, R5_
  - _Avance parcial: `UpdateConsent.revoke` y `DeleteChildProfile` (borrado
    simple) están implementados y probados. Falta el workflow completo de
    ADR-003 (`DeletionJob`, cursor reanudable, limpieza de idempotencia y
    localizadores) porque depende de los agregados `Challenge`/`Attempt` que
    aún no existen. No marcar como completada hasta cubrir ese workflow._
- [ ] 11. Ejecutar pruebas IDOR, logging sin PII y revisión de seguridad
  - _Requisitos: R6_
  - _Avance parcial: las pruebas IDOR de la tarea 5 cubren perfiles. Falta
    revisión de seguridad formal, verificación de logging sin PII en
    Powertools/CloudWatch real y pruebas de rate limiting._
- [ ] 12. Documentar runbook de recuperación, revocación y borrado
  - _Requisitos: R2, R5_

Siguiente responsable: **Francis** en 1, 2, 9 (coordina con Jerick), 10, 11 y
12. Los textos legales de la tarea 2 los define **Clau/PM + asesoría legal**.

