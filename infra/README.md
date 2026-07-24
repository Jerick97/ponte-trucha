# Infraestructura AWS

Owner: **Francis**.

## Estado

La fase inicial del backend está implementada y probada contra Floci. Incluye:

- `modules/data`: dos tablas DynamoDB provisionadas con PK/SK, cifrado y TTL;
- `modules/identity`: User Pool exclusivo de adultos, app client público OAuth
y resource server con scopes cerrados;
- `modules/api`: HTTP API, JWT authorizer, Lambdas `api-core` y `api-ia`, IAM
mínimo, concurrencia reservada y log groups con retención;
- `environments/dev`: composición del ambiente y secreto HMAC sin valor en
Terraform state;
- `backend/`: FastAPI, empaquetado ZIP Linux arm64 y pruebas de arquitectura,
HTTP y OpenAPI.

No hay despliegue en AWS real. `infra/lambda/estafador/index.mjs` sigue siendo
el fallback legado del demo y no forma parte de esta API.

### Floci

El ambiente `dev` usa Floci cuando `use_floci=true` y las credenciales/endpoints
se pasan por variables de entorno. Nunca se guardan credenciales en `.tfvars`.

```bash
export AWS_ENDPOINT_URL="http://<host-floci>:4566"
export AWS_DEFAULT_REGION="us-east-1"
export AWS_ACCESS_KEY_ID="test"
export AWS_SECRET_ACCESS_KEY="test"

backend/.venv/bin/python backend/scripts/package_lambdas.py
terraform -chdir=infra/environments/dev init -backend=false
terraform -chdir=infra/environments/dev plan
sh scripts/probar-floci.sh
```

Floci no implementa `CreateUserPoolDomain`, AWS Budgets ni el
etiquetado/configuración de stages HTTP. Solo cuando `use_floci=true` se omiten
esas operaciones. En AWS real el Hosted UI, presupuesto con alerta, tags, logs
de acceso, alarmas de throttling y límites del stage permanecen habilitados.

### Antes de un deploy en AWS real

No se debe aplicar `dev` contra AWS hasta completar estos valores fuera del
repositorio y del state:

1. Definir `use_floci=false`, al menos un correo operativo adulto en
   `budget_alert_emails` y el límite mensual aprobado.
2. Pasar `web_adapter_layer_arn` para la layer arm64 de Lambda Web Adapter. El
   plan se detiene si falta para evitar Lambdas que no puedan iniciar FastAPI.
3. Crear una versión del secreto después de que Terraform cree su contenedor:

   ```bash
   aws secretsmanager put-secret-value \
     --secret-id ptk/dev/parent-ref-hmac \
     --secret-string "$(openssl rand -base64 32)"
   ```

   El valor no se declara en Terraform, outputs ni archivos `.tfvars`.
4. Revisar el plan y probar el adaptador Web/API Gateway de extremo a extremo.


## Arquitectura objetivo

| Capacidad | Servicio |
|---|---|
| frontend | S3 privado + CloudFront OAC |
| identidad adulta | Cognito User Pool |
| API | API Gateway HTTP API + JWT scopes |
| cómputo | Lambda Python 3.14 + FastAPI/Web Adapter |
| persistencia | DynamoDB |
| IA opcional | Bedrock con retención cero |
| operación | CloudWatch + Powertools |
| errores | Sentry sanitizado |
| producto | Mixpanel server-side y consentido |
| IaC | Terraform |

No se usa EC2, RDS, VPC ni NAT Gateway en el MVP.

Diagrama:
[`docs/diagramas/arquitectura-backend.svg`](../docs/diagramas/arquitectura-backend.svg).

## Principios

- Cuenta Cognito solo del adulto; perfiles infantiles en DynamoDB.
- IAM mínimo por función.
- No cuerpos, tokens, PII, chat, prompts ni respuestas en logs.
- Secrets fuera del frontend y del state Terraform.
- Retención/TTL explícitos.
- Mixpanel apagado por defecto; Sentry sin PII.
- Presupuesto, alarmas, quotas y concurrency antes de producción.
- `terraform fmt`, `validate` y `test` antes de plan/apply.
- Tests con mocks/plan por defecto; `apply` de tests requiere aprobación porque
  puede crear recursos.

## Costo

“Dentro del free tier” es un objetivo y debe verificarse contra la cuenta real:
las condiciones de AWS dependen de la fecha de alta y los créditos disponibles.
La arquitectura evita costos fijos; Bedrock, Sentry y Mixpanel requieren flags
y límites. Budgets puede alertar con retraso y no sustituye cuotas/concurrency.

Para DynamoDB, comenzar con capacidad provisionada y mantener el total regional
por debajo del allowance; on-demand no consume las 25 RCU/WCU gratuitas. Para
el edge, evaluar el plan CloudFront Free de $0 vigente. Ver
`.kiro/docs/costos-aws.md`.

## Legado

Para mantener el demo existente, ver `.kiro/docs/guia-despliegue.md`. Esa guía
no define la infraestructura objetivo.
