# Infraestructura AWS

Owner: **Francis**.

## Estado

`infra/lambda/estafador/index.mjs` es el fallback legado del demo. El backend
serverless completo todavía no está implementado. Kiro debe seguir, en orden:

1. `.kiro/specs/backend-serverless/requirements.md`
2. `.kiro/specs/backend-serverless/design.md`
3. `.kiro/specs/backend-serverless/tasks.md`

No ampliar la Function URL Node existente como si fuera la API nueva.

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

## Estructura objetivo

```text
infra/
├── modules/
│   ├── edge/
│   ├── identity/
│   ├── api/
│   ├── data/
│   └── observability/
├── environments/
│   ├── dev/
│   └── prod/
└── tests/
```

Esta estructura es una decisión de diseño, no una autorización para crearla
fuera de las tareas.

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
