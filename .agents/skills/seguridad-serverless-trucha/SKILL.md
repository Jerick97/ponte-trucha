---
name: seguridad-serverless-trucha
description: Audita cambios de Ponte Trucha Kids en autenticación, autorización, privacidad infantil, secretos, API, AWS, Terraform, IA, observabilidad y dependencias. Úsala antes de entregar cambios que toquen Cognito, perfiles, consentimientos, datos, IAM, endpoints, Bedrock, Mixpanel, Sentry, despliegue o límites de confianza.
---

# Seguridad Serverless Trucha

Priorizar rutas de abuso concretas y evidencia. Empezar con verificaciones
read-only/no intrusivas.

## Preparación

1. Confirmar alcance, ambiente y autorización.
2. Leer AGENTS, steering de seguridad/arquitectura, threat model, spec y diff.
3. Identificar activos, actores, permisos, datos y trust boundaries.
4. Trazar datos desde navegador/token hasta API, DynamoDB, logs y terceros.

No ejecutar pruebas destructivas, ruidosas, credential stuffing, persistencia,
producción ni gasto AWS sin aprobación explícita.

## Checklist de alto valor

### Identidad y autorización

- Cognito pertenece solo al adulto.
- API Gateway exige access token, audience/issuer y scopes.
- Ownership se deriva del token en cada read/update/delete/export.
- Probar IDOR con dos adultos y child IDs cruzados.
- Admin SDK/service role no omite reglas de ownership.
- Respuestas no confirman la existencia de un perfil ajeno.
- Mass assignment no permite cambiar owner, score, consentimiento o estado.

### Consentimiento/privacidad infantil

- Fecha adulta procesada en memoria y no persistida/logueada.
- Age gate no se presenta como consentimiento verificable.
- Finalidades separadas, opcionales off por defecto, versionadas y revocables.
- Perfil sin nombre, fecha, email, teléfono, foto, voz, ubicación o contactos.
- Exportación/borrado cubre DynamoDB y proveedores.
- Retención/TTL definidos y probados.

### API/aplicación

- Validación estricta de tamaño, enums, URLs y payload discriminado.
- Idempotencia evita doble score/consentimiento/borrado.
- Challenge no revela respuesta antes del intento.
- Rate limits, timeout, concurrency y CORS.
- RFC 9457 no filtra stack, reglas internas ni PII.
- SSRF/redirects/enlaces se simulan o validan; no se navegan desde backend.
- Inyección, path traversal y expresiones DynamoDB parametrizadas.

### IA

- Consentimiento vigente, feature flag y kill switch.
- Entrada desidentificada; prompt/respuesta/chat no se persisten.
- Bedrock con retención cero y modelo permitido.
- Guardrails independientes del prompt, fallback curado y pruebas adversariales.
- Sin LLM monitoring que capture contenido.

### Observabilidad

- Logs por allowlist; nunca evento/body/headers/token/PII/chat.
- Sentry `send_default_pii=false`, IP scrubbing y `before_send`.
- Mixpanel server-side, `ip=0`, catálogo cerrado y consentimiento.
- Proveedores caídos no rompen el juego.
- Métricas sin dimensiones de alta cardinalidad o IDs.

### AWS/Terraform/supply chain

- IAM mínimo; secretos fuera de repo/state/output.
- S3 privado/OAC, cifrado, retención y tags.
- Dependencias fijadas y escaneadas; acciones CI por SHA cuando aplique.
- Ninguna credencial persistente en CI/artifacts/screenshots.
- Tests Terraform usan mocks/plan por defecto.
- Presupuesto, alarmas y límites; ningún servicio caro no aprobado.

## Ejecución

1. Revisar código/config/documentos relevantes.
2. Correr checks existentes de secrets, lint, tests y Terraform sin modificar
   infraestructura.
3. Crear casos de prueba solo si la tarea autoriza implementación.
4. Relacionar cada finding con archivo/evidencia y una ruta plausible.
5. Ordenar por severidad e impacto.
6. Informar áreas limpias, checks omitidos y riesgo residual.

Severidades:

- **Crítica:** exposición/acción inmediata sobre menores, credenciales o
  producción.
- **Alta:** bypass de auth/ownership, persistencia de PII/chat, IA sin guardrails.
- **Media:** hardening o resiliencia explotable con condiciones.
- **Baja:** defensa en profundidad/documentación sin exploit directo.

No reportar hipótesis vagas. Si no hay hallazgos, decir qué se auditó y qué no.

## Fuentes

Leer `references/FUENTES.md` para procedencia.

