# Seguridad y privacidad infantil

Estas reglas son innegociables. El producto está dirigido a niños de 8 a 13
años, pero la cuenta y las decisiones legales pertenecen al padre, madre o
tutor.

## Principio rector

Recolectar lo mínimo, explicar cada finalidad, negar por defecto y poder borrar.
Una fecha de nacimiento adulta es solo un **age gate**, no prueba suficiente de
identidad ni consentimiento verificable.

## Onboarding adulto

1. Mostrar una pantalla claramente dirigida al adulto.
2. Pedir fecha de nacimiento solo para comprobar mayoría de edad.
3. Procesarla en memoria y guardar únicamente `ageGatePassedAt` y la versión de
   la regla. No persistir la fecha.
4. Crear/verificar la cuenta adulta en Cognito.
5. Presentar aviso de privacidad y consentimientos separados:
   - tratamiento necesario para la cuenta y el progreso;
   - procesamiento con IA server-side, si se activa;
   - analítica de producto con Mixpanel, opcional y apagada por defecto.
6. Registrar versión, finalidad, timestamp y método de cada consentimiento.
7. Permitir revocación y borrado desde el área del adulto.

Antes de producción se requiere revisión legal local del mecanismo de
consentimiento verificable. No afirmar “cumple COPPA” o “cumple la ley peruana”
sin esa revisión.

## Identidad

- Cognito contiene solo la cuenta adulta.
- El niño no tiene correo, teléfono, contraseña, cuenta social ni acceso directo
  a Cognito.
- Un perfil infantil usa ID aleatorio, alias/avatar predefinido y banda etaria,
  no nombre real ni fecha de nacimiento.
- Nunca exponer `cognitoSub` a Mixpanel, Sentry o Bedrock.
- Toda operación sobre un perfil comprueba ownership desde el access token.

## Datos permitidos y prohibidos

| Permitido | Prohibido |
|---|---|
| Banda `8-10` o `11-13` | Fecha de nacimiento del niño |
| Alias/avatar de catálogo | Nombre real, foto o voz |
| Canal, dificultad, acierto y puntos | Correo/teléfono del niño |
| Código de guardrail | Texto libre/chat en logs o analítica |
| Tiempo de respuesta por rango | IP, geolocalización o fingerprint |
| Consentimiento versionado del adulto | Token, contraseña o respuestas secretas |

El texto que el niño escriba al estafador es efímero. Solo puede usarse para la
respuesta inmediata; no se guarda en DynamoDB, logs, Sentry ni Mixpanel.

## IA y contenido

- La IA no publica retos directamente. Toda salida pasa por esquema, reglas
  semánticas, filtros de seguridad y fallback curado.
- Ámbito: phishing, fraude digital y señales de confianza. Nunca acoso sexual,
  grooming, amenazas, autolesión, odio, drogas ni manipulación personal.
- No pedir al niño secretos reales, datos personales, fotos, voz, ubicación,
  contactos ni credenciales.
- El estafador se detiene si el niño se niega, bloquea o busca a un adulto.
- Amazon Bedrock debe usar retención cero y un modelo compatible. Si no puede
  garantizarse, se deshabilita el fallback.
- Prompt y respuesta no incluyen IDs de cuenta/perfil ni texto histórico.

## Observabilidad segura

### CloudWatch y Powertools

- Logging estructurado con lista permitida.
- No activar logging automático del evento completo.
- Métricas con dimensiones de baja cardinalidad.
- Retención explícita y corta en `dev`; revisar la de `prod`.
- Alarmas no incluyen payloads.

### Sentry

- `send_default_pii=false`.
- Eliminar headers, cookies, query strings, body, user, breadcrumbs de entrada y
  variables sensibles mediante `before_send`.
- Activar scrubbing server-side e IP scrubbing.
- Sin Session Replay, feedback del usuario ni LLM monitoring.
- Tags permitidos: ambiente, release, ruta normalizada, status y código de error.

### Mixpanel

- Feature flag apagado por defecto.
- Enviar server-side solo si existe consentimiento analítico vigente.
- IDs analíticos aleatorios y revocables; nunca Cognito `sub`.
- Deshabilitar geolocalización (`ip=0`) y perfiles enriquecidos.
- Sin autocapture, Session Replay, heatmaps ni texto libre.
- Solo eventos/propiedades del catálogo aprobado.
- Revocar consentimiento detiene nuevos eventos y dispara borrado del ID.

## Seguridad de API

- HTTPS únicamente.
- API Gateway JWT authorizer con scopes; usar access token, no ID token.
- CORS restringido a CloudFront y localhost solo en `dev`.
- Rate limits, cuotas y reserved concurrency con valores documentados.
- `Idempotency-Key` en mutaciones para evitar puntuación o borrado duplicado.
- Validación Pydantic con límites de tamaño y enums cerrados.
- Respuestas no revelan existencia de perfiles ajenos.
- IAM de mínimo privilegio por Lambda.
- Secrets en Secrets Manager/SSM; nunca `VITE_*`.
- Dependencias fijadas, SBOM/scan en CI y actualizaciones revisadas.

## Retención y derechos

- Definir TTL por tipo de dato antes de crear la tabla.
- Retos emitidos e idempotencia expiran automáticamente.
- Historial detallado se resume y elimina cuando deja de ser necesario.
- El adulto puede exportar, revocar y borrar todos sus perfiles.
- El borrado incluye DynamoDB, IDs de Mixpanel y cualquier sistema externo
  permitido; los backups siguen su política documentada.
- Registrar el evento de borrado sin conservar los datos borrados.

## Checklist de entrega

- [ ] Fecha adulta no persistida.
- [ ] Consentimientos separados, versionados y revocables.
- [ ] Cuenta solo adulta; perfiles sin PII infantil.
- [ ] Pruebas IDOR y de autorización pasan.
- [ ] Ningún cuerpo/chat/token aparece en logs o errores.
- [ ] Mixpanel está apagado sin consentimiento.
- [ ] Sentry elimina PII antes de salir de AWS.
- [ ] Bedrock usa retención cero o está deshabilitado.
- [ ] Borrado integral probado en `dev`.
- [ ] Presupuesto, límites y alarmas configurados.
