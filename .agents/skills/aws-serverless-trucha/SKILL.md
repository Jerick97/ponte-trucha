---
name: aws-serverless-trucha
description: Diseña, implementa, revisa o diagnostica el backend AWS serverless de Ponte Trucha Kids con Cognito, API Gateway HTTP API, Lambda Python/FastAPI, DynamoDB, Bedrock, CloudWatch y Terraform. Úsala al tocar arquitectura backend, servicios AWS, IAM, costos, APIs, persistencia, IA server-side o infraestructura del proyecto.
---

# AWS Serverless Trucha

Trabajar como una guía del backend objetivo, no como autorización de despliegue.

## Antes de actuar

Leer completos:

1. `.kiro/steering/arquitectura.md`
2. `.kiro/steering/seguridad-infantil.md`
3. `.kiro/steering/estandares-de-codigo.md`
4. `requirements.md`, `design.md` y `tasks.md` de la feature solicitada
5. `infra/README.md`

Confirmar en qué estado está la tarea. No afirmar que la arquitectura objetivo
ya existe.

## Decisiones fijas del MVP

- Cuenta adulta en Cognito; niños como perfiles sin credenciales.
- S3 privado + CloudFront OAC.
- API Gateway HTTP API con JWT authorizer y access-token scopes.
- Lambda Python + FastAPI + AWS Lambda Web Adapter.
- DynamoDB, sin RDS.
- Sin EC2, VPC, NAT Gateway, OpenSearch, Kubernetes ni provisioned concurrency.
- Bedrock solo con consentimiento, retención cero y contenido desidentificado.
- CloudWatch/Powertools como fuente operativa.
- Sentry sanitizado y Mixpanel opt-in; fallar nunca rompe el juego.
- Terraform como fuente de verdad.

Si una tarea exige contradecir una decisión, detenerse y proponer primero un
ADR/spec.

## Flujo de trabajo

1. Traducir la tarea a criterios observables y límites de datos.
2. Identificar trust boundaries, IAM, access patterns, retención y costo.
3. Escribir primero la prueba que falla:
   - dominio/uso con pytest;
   - contrato OpenAPI;
   - adapter/integración;
   - Terraform con mocks o `command = plan`.
4. Implementar el mínimo dentro de ports and adapters.
5. Aplicar mínimo privilegio, límites, timeouts, idempotencia y falla segura.
6. Ejecutar verificaciones y registrar evidencia.
7. Actualizar spec/diagrama si cambió contrato o servicio.
8. Marcar `[x]` solo la tarea verificada e indicar el siguiente owner.

## Reglas por servicio

### Cognito/API Gateway

- Cognito representa al adulto y no almacena fecha de nacimiento.
- Usar app client público sin secret para SPA.
- API Gateway valida issuer, audience, expiración y scopes.
- El backend deriva ownership del token; nunca acepta `parentId` del body.
- CORS solo para CloudFront y localhost en `dev`.

### Lambda/FastAPI

- Dominio sin imports de FastAPI, boto3 ni SDK externos.
- No loguear evento completo, body, headers, cookies, token, PII o chat.
- Límites explícitos de body, timeout y concurrency.
- No confiar en background tasks in-process para entrega garantizada.
- Errores RFC 9457, sin stack trace.

### DynamoDB

- Diseñar desde access patterns; no perseguir single-table por estética.
- Preferir capacidad provisionada dentro del allowance mensual documentado; el
  modo on-demand necesita una decisión explícita de costo.
- Prohibir `Scan` en rutas de usuario.
- Condiciones/transacciones para ownership, estados e idempotencia.
- TTL para retos emitidos e idempotencia.
- Borrado/exportación forman parte del diseño, no una tarea posterior.

### Bedrock

- Feature flag y consentimiento vigente.
- Retención cero y modelo compatible; si no, deshabilitar.
- Sin IDs, historial, PII ni logs de prompt/respuesta.
- Cadena completa de guardrails y fallback curado.
- IAM limitado al modelo/acciones necesarios.

### Observabilidad/costo

- Powertools Logger/Metrics/Tracer con allowlist.
- Sentry `send_default_pii=false` y scrubber antes de enviar.
- Mixpanel server-side, `ip=0`, allowlist y opt-in.
- Presupuesto, alarmas, quotas y reserved concurrency.
- Recordar que free tier/créditos dependen de la cuenta; no prometer USD 0.

## Despliegue

No ejecutar `terraform apply`, comandos de creación AWS ni cambios de producción
salvo petición explícita. Antes de un apply autorizado:

1. `terraform fmt -check -recursive`
2. `terraform validate`
3. `terraform test`
4. plan guardado y revisado
5. estimación/alertas de costo
6. cuenta, región y ambiente confirmados
7. estrategia de rollback/borrado

Los tests con `command = apply` crean recursos: requieren revisión explícita.

## Fuentes

Leer `references/FUENTES.md` al actualizar servicios, runtimes o prácticas AWS.
