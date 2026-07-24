# Requisitos — Autenticación y consentimiento parental

**Owner:** Francis  
**Estado:** aprobado para planificación; implementación pendiente  
**Dependencias:** backend-serverless

## Glosario

- **Adulto:** padre, madre o tutor que controla la cuenta.
- **Perfil infantil:** identidad interna sin credenciales ni PII.
- **Age gate:** comprobación inicial de mayoría de edad; no equivale a
  consentimiento verificable.
- **Finalidad:** uso específico de datos (`core`, `serverSideAi`,
  `productAnalytics`).

## Requisitos EARS

### R1 — Age gate adulto

- CUANDO una persona inicia el registro, EL SISTEMA DEBE mostrar una experiencia
  dirigida al adulto antes de Cognito.
- CUANDO el adulto ingresa su fecha de nacimiento, EL SISTEMA DEBE calcular la
  elegibilidad sin persistir ni registrar la fecha.
- SI no supera la mayoría de edad configurada, EL SISTEMA DEBE impedir el
  registro sin revelar reglas que faciliten evadir el gate.
- SI supera el gate, EL SISTEMA DEBE guardar como máximo la versión de la regla
  y el timestamp de aprobación.

### R2 — Cuenta adulta

- CUANDO el age gate es válido, EL SISTEMA DEBE permitir registro y verificación
  de una cuenta adulta con Cognito.
- CUANDO el adulto inicia sesión, API Gateway DEBE validar un access token y los
  scopes antes de invocar el backend.
- EL SISTEMA NO DEBE crear credenciales de Cognito para un perfil infantil.
- CUANDO la sesión termina o expira, EL SISTEMA DEBE negar rutas protegidas.

### R3 — Consentimiento versionado

- CUANDO el adulto completa la verificación, EL SISTEMA DEBE mostrar el aviso de
  privacidad vigente antes de crear perfiles.
- EL SISTEMA DEBE registrar decisiones separadas para `core`, `serverSideAi` y
  `productAnalytics`.
- EL SISTEMA DEBE iniciar las finalidades opcionales como rechazadas.
- CUANDO cambia materialmente una política, EL SISTEMA DEBE solicitar una nueva
  decisión antes de usar esa finalidad.
- CUANDO el adulto revoca una finalidad, EL SISTEMA DEBE detener su uso y
  ejecutar las acciones de borrado aplicables.

### R4 — Perfiles infantiles

- CUANDO existe consentimiento `core` vigente, EL ADULTO DEBE poder crear un
  perfil con alias/avatar de catálogo y banda `8-10` o `11-13`.
- EL SISTEMA NO DEBE pedir nombre real, fecha de nacimiento, correo, teléfono,
  foto, voz ni ubicación del niño.
- CUANDO un adulto consulta/modifica/borra un perfil, EL SISTEMA DEBE comprobar
  ownership desde el `sub` validado, no desde datos enviados por el cliente.
- SI el perfil pertenece a otra cuenta, EL SISTEMA DEBE responder sin confirmar
  su existencia.

### R5 — Gestión y borrado

- EL ADULTO DEBE poder ver sus consentimientos y perfiles.
- CUANDO borra un perfil, EL SISTEMA DEBE eliminar o anonimizar progreso,
  intentos, IDs analíticos y datos derivados según la política.
- CUANDO borra su cuenta, EL SISTEMA DEBE incluir todos sus perfiles y
  consentimientos.
- CUANDO se solicita borrado, EL SISTEMA DEBE ser idempotente y auditable sin
  conservar los datos eliminados.

### R6 — Seguridad y privacidad

- EL SISTEMA DEBE usar `Idempotency-Key` en cambios de consentimiento y borrado.
- EL SISTEMA NO DEBE enviar fecha adulta, email, tokens, `sub` o `childId` a
  Mixpanel, Sentry o Bedrock.
- EL SISTEMA DEBE limitar intentos de registro, recuperación y endpoints
  protegidos.
- EL SISTEMA DEBE contar con pruebas de IDOR usando dos cuentas adultas.

## Criterios de aceptación globales

- La fecha adulta no aparece en DynamoDB, CloudWatch, Sentry ni Mixpanel.
- Un niño puede jugar usando perfil sin poseer credenciales.
- Analítica e IA server-side funcionan únicamente con consentimiento vigente.
- Revocación y borrado están cubiertos por pruebas unitarias, contrato e
  integración.
- El mecanismo de consentimiento verificable queda señalado como gate legal
  pendiente antes de producción.

