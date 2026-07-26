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

## Enmienda 2026-07-25 — sesión que sobrevive a la recarga

### Contexto

La decisión original dejaba la sesión solo en memoria, así que recargar la página
devolvía al adulto a la landing. En un juego que el niño abre y cierra varias
veces, eso obligaba a iniciar sesión constantemente y, peor, a crear un perfil
nuevo cada vez, dejando el progreso anterior inalcanzable.

También cambió el flujo de login en local: el emulador no implementa Hosted UI
ni `/oauth2/authorize`, así que la SPA usa `USER_PASSWORD_AUTH` contra
`cognito-idp`. Hosted UI + PKCE sigue siendo la decisión para AWS real.

### Decisión

El **access token** sigue solo en memoria. El **refresh token** se guarda en
`sessionStorage` (`src/api/sesionGuardada.ts`) y al cargar la página se cambia
por un access token nuevo con `REFRESH_TOKEN_AUTH`. Cerrar sesión revoca el
refresh token en Cognito y lo borra del navegador.

`localStorage` sigue prohibido: no expira y sobrevive al cierre del navegador en
un equipo compartido.

### Consecuencias y deuda aceptada

- `sessionStorage` es legible por JavaScript: un XSS o una dependencia
  comprometida podría leer el refresh token. Se acepta para el MVP.
- La forma correcta es el patrón BFF: el backend emite una cookie
  `HttpOnly; Secure; SameSite=Strict` con el refresh token y la SPA nunca lo ve.
  Exige un endpoint de sesión y que CloudFront sirva el API en el mismo origen,
  porque en dominios distintos la cookie queda como de terceros. Queda como
  tarea de `autenticacion-consentimiento-parental` y de la spec de despliegue.
- Mitigaciones vigentes mientras exista la deuda: el access token no se
  persiste, el token guardado muere al cerrar la pestaña, se revoca al cerrar
  sesión, y la salida del área de juego pide el código del adulto para que el
  niño no llegue solo al área de padres.
