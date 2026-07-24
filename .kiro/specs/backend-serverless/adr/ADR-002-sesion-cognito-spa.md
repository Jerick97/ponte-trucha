# ADR-002 — Sesión Cognito para la SPA

- **Estado:** aceptado para el MVP
- **Fecha:** 2026-07-24
- **Owner:** Francis
- **Requisitos:** backend-serverless R1; autenticacion-consentimiento-parental R2 y R6

## Decisión

La SPA usa Cognito Hosted UI con Authorization Code + PKCE y un app client público
sin secreto. El access token se conserva solo en memoria y viaja por
`Authorization: Bearer`; nunca se almacena en `localStorage`, URL ni telemetría.

El User Pool define el resource server `ponte-trucha-api` con scopes:
`profiles.read`, `profiles.write`, `consents.read`, `consents.write`, `game.play`
y `account.delete`. API Gateway HTTP API valida issuer, audiencia, expiración y
los scopes de cada ruta antes de invocar `api-core`.

## Consecuencias

- Solo Cognito contiene el email de la cuenta adulta.
- El frontend deberá manejar la renovación de sesión con el flujo OAuth; la
integración de UI queda para su tarea coordinada con Jerick.
- La prueba en Floci valida la configuración del User Pool, cliente, scopes y
JWT authorizer. La interoperabilidad OAuth completa se confirma en `dev`.
