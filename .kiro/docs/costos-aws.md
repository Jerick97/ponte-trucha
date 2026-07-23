# Guardrails de costo AWS

**Verificado:** 23 de julio de 2026.  
**Objetivo:** minimizar riesgo de cobro; “USD 0” no es una garantía.

Los precios, créditos y allowances cambian. Revisar estas fuentes antes de cada
deploy público y después de cambiar de plan/cuenta.

## Condición de la cuenta

Desde el 15 de julio de 2025, una cuenta AWS nueva puede elegir un free plan de
seis meses y recibir hasta USD 200 en créditos elegibles. Los créditos no son lo
mismo que allowances mensuales permanentes y tienen vencimiento.

Primera tarea del setup:

1. confirmar fecha de alta y tipo de plan;
2. revisar saldo/vencimiento de créditos;
3. identificar región y payer account;
4. crear presupuesto/alertas;
5. fijar cuotas/concurrency que limiten consumo.

Fuente: [AWS Free Tier para cuentas nuevas](https://aws.amazon.com/about-aws/whats-new/2025/07/aws-free-tier-credits-month-free-plan/).

## Baseline del MVP

| Servicio | Allowance/plan relevante al corte | Decisión |
|---|---|---|
| CloudFront | plan Free $0: 1 M requests, 100 GB, 5 GB S3 incluidos, sin sobrecargos del plan | una distribución; confirmar condiciones antes de migrar |
| Cognito | 10 000 MAU/mes en Lite o Essentials para login directo/social | usar Lite salvo requisito aprobado; evitar SMS |
| API Gateway HTTP API | 1 M llamadas/mes por 12 meses para clientes nuevos | HTTP API, no REST API |
| Lambda | 1 M requests y 400 000 GB-s/mes | memoria/timeout medidos; sin provisioned concurrency |
| DynamoDB | 25 RCU, 25 WCU y 25 GB/mes, usando provisioned Standard | provisioned y suma regional bajo el allowance |
| Bedrock | cobro por modelo/uso; no asumir gratis | apagado por flag, límites y fallback curado |
| CloudWatch | logs/custom metrics/dashboards pueden cobrar | retención corta, baja cardinalidad, dashboard mínimo |

Fuentes:

- [CloudFront pricing/Free plan](https://aws.amazon.com/cloudfront/pricing/)
- [Cognito pricing](https://aws.amazon.com/cognito/pricing/)
- [API Gateway pricing](https://aws.amazon.com/api-gateway/pricing/)
- [Lambda pricing](https://aws.amazon.com/lambda/pricing/)
- [DynamoDB pricing/free tier](https://aws.amazon.com/dynamodb/pricing/)

## DynamoDB

El free tier de throughput usa **provisioned capacity**. On-demand cobra por
request aunque el almacenamiento inicial pueda quedar dentro de 25 GB.

El ADR físico debe calcular la suma de todas las tablas en la misma región y
cuenta pagadora. Ejemplo orientativo, no decisión final:

- tabla de dominio `dev`: 5 RCU / 5 WCU;
- tabla de idempotencia `dev`: 5 / 5;
- tablas equivalentes de demo/prod: 10 / 10;
- total: 20 RCU / 20 WCU, dejando margen hasta 25 / 25.

No habilitar autoscaling por encima del allowance sin alarma/costo aprobado. Si
el tráfico real produce throttling, decidir entre ajustar capacidad dentro del
margen, usar créditos/on-demand o limitar el demo; no esconder el problema.

## CloudFront

Evaluar el plan Free flat-rate vigente en vez de asumir el free tier histórico.
Al corte, AWS muestra $0/mes, una distribución, 1 M requests, 100 GB de
transferencia, 5 GB de almacenamiento S3 incluido y sin cobros por exceso dentro
del plan; el servicio limita/gestiona el allowance según sus términos.

Verificar que OAC, configuración actual y dominio encajen antes de migrar una
distribución existente. No activar extras fuera del plan sin revisar precio.

## Límites técnicos

- Lambda reserved concurrency baja por función y timeout pequeño.
- API Gateway throttling por stage/ruta.
- Bedrock: kill switch, cuota y máximo de generación.
- DynamoDB: capacidad provisionada limitada.
- Logs: no DEBUG en prod, retención explícita y sin payloads.
- S3: lifecycle para artifacts/logs; versioning según necesidad real.
- Un solo ambiente AWS activo durante el demo si no se necesita prod separado.
- Sin NAT Gateway, EC2, RDS, OpenSearch ni provisioned concurrency.

## Alarmas

- Presupuesto de USD 1 y USD 5 o valores que permita la cuenta.
- Forecast/actual spend.
- Anomaly detection si está disponible sin costo adicional aceptable.
- Lambda throttles/concurrency/duration.
- DynamoDB consumed capacity/throttles.
- Bedrock invocation/token/costo disponibles.

AWS Budgets y Cost Explorer pueden tener retraso. Los límites técnicos son la
primera barrera; las alertas son la segunda.

## Servicios externos

Mixpanel y Sentry pueden tener planes gratuitos, pero no se consideran parte del
free tier AWS. Antes de activarlos verificar:

- límites y sobrecargos;
- retención/residencia;
- tarjeta requerida;
- comportamiento al exceder cuota;
- feature flag para apagarlos.

