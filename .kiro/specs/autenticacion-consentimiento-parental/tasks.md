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
- [x] 9. Integrar onboarding adulto y sesión con el frontend
  - _Requisitos: R1, R2, R3_
  - _Coordinación: toca UI de Jerick y estado compartido; avisar antes_
  - _Verificado: `src/api/cognito.ts` habla con el User Pool (SignUp,
    ConfirmSignUp, ResendConfirmationCode, InitiateAuth, RevokeToken) sin SDK ni
    secretos; `src/store/sesion.ts` ya no simula el login: crea la cuenta con
    `POST /v1/cuenta`, registra una decisión por finalidad con
    `PATCH /v1/consentimientos/{purpose}` y crea el perfil con `POST /v1/perfiles`
    usando el `childId` del servidor. El access token vive en `src/api/token.ts`
    (memoria; nunca storage ni URL). UI nueva: `PasoConfirmacion.tsx` y estados
    remotos en `PasoAcceso`/`PasoConsentimiento`/`PasoPerfil`. Pruebas:
    `src/test/sesion.test.ts` (21, con `fetch` falso: puertas del flujo, error de
    Cognito, confirmación pendiente y privacidad). AWS real usa Hosted UI +
    Authorization Code + PKCE según ADR-002; el emulador conserva el flujo
    directo porque no implementa Hosted UI._
- [ ] 10. Implementar revocación, borrado y sus pruebas de integración
  - _Requisitos: R3, R5_
  - _Avance parcial: revocación y borrado limpian cuenta/perfil, consentimientos,
    retos, intentos, progreso, localizadores e idempotencia, con replay e IDOR
    probados. Falta el `DeletionJob` con cursor reanudable de ADR-003 para
    garantizar recuperación ante fallos parciales._
- [ ] 11. Ejecutar pruebas IDOR, logging sin PII y revisión de seguridad
  - _Requisitos: R6_
  - _Avance parcial: las pruebas IDOR de la tarea 5 cubren perfiles. Falta
    revisión de seguridad formal, verificación de logging sin PII en
    Powertools/CloudWatch real y pruebas de rate limiting._
- [ ] 12. Documentar runbook de recuperación, revocación y borrado
  - _Requisitos: R2, R5_

## Sesión y control parental en el dispositivo

- [x] 13. Reanudar la sesión del adulto tras recargar, sin volver a la landing
  - _Requisitos: R2, R6_
  - _Verificado: `src/api/sesionGuardada.ts` guarda solo el refresh token en
    `sessionStorage`; `useSesion.restaurar()` lo cambia por un access token con
    `REFRESH_TOKEN_AUTH`, recupera cuenta, correo, consentimientos y perfiles, y
    olvida la sesión si algo falla. Cerrar sesión revoca el token en Cognito.
    Deuda aceptada y migración a cookie `HttpOnly` (patrón BFF) registradas en la
    enmienda de ADR-002. Pruebas: `src/test/sesion.test.ts` (31), incluidas
    "el access token nunca se persiste" y "nunca en localStorage"; verificado
    también por HTTP contra el emulador (login, refresh, GetUser, revocación)._
- [x] 14. Listar y elegir perfiles infantiles al entrar
  - _Requisitos: R4_
  - _Verificado: `GET /v1/perfiles` alimenta `PasoPerfiles.tsx`; elegir un perfil
    conserva su `childId` y su progreso, y crear otro respeta el máximo de 4 que
    impone el backend. Pruebas en `src/test/sesion.test.ts`._
- [ ] 15. Exigir un código del adulto para salir del juego y entrar al área de padres
  - _Requisitos: R2, R6_
  - _Diseño acordado: PIN de 4 a 6 dígitos definido por el adulto, guardado solo
    como hash `scrypt` con salt por cuenta (librería estándar), con límite de
    intentos y bloqueo temporal por TTL. Nunca en el frontend ni en logs.
    Requiere ADR que documente la excepción a "no guardar respuestas secretas"._
- [ ] 16. Migrar la sesión a cookie `HttpOnly` (patrón BFF) y retirar `sessionStorage`
  - _Requisitos: R2, R6_
  - _Depende de que CloudFront sirva `/v1` en el mismo origen que la SPA._

Siguiente responsable: **Francis** en 1, 2, 10, 11, 12, 15 y 16. Los textos
legales de la tarea 2 los define **Clau/PM + asesoría legal**.
