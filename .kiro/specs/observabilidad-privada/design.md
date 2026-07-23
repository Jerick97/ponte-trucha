# Diseño — Observabilidad privada

## Capas

1. Powertools → CloudWatch: siempre activo, con datos técnicos mínimos.
2. Sentry: errores complementarios, flag y sanitización.
3. Domain events → AnalyticsPort → Mixpanel: consentimiento + allowlist.

Ver `.kiro/docs/observabilidad-y-privacidad.md`.

## Componentes

```text
Use case
  └─ DomainEvent (sin SDK)
       └─ ConsentAwareAnalytics
            ├─ NullAnalytics (default)
            └─ MixpanelAdapter (allowlist + ip=0)

Entrypoint / exception boundary
  ├─ Powertools Logger/Metrics/Tracer
  └─ SentryErrorReporter (scrubber + sampling)
```

`AnalyticsPort.track(event)` acepta clases/eventos tipados, no un diccionario
libre. El adapter traduce a nombres externos.

## Falla segura

- `NullAnalytics` es el default.
- Analytics/reporting tienen timeout corto.
- Excepciones se consumen en el adapter y emiten un contador CloudWatch.
- No usar background task in-process como garantía de entrega en Lambda.
- EventBridge/SQS queda como evolución si medición demuestra necesidad.

## Sanitización Sentry

Eliminar recursivamente:

- `request`, `headers`, `cookies`, `query_string`, `body`, `user`;
- claves que coincidan con `token`, `authorization`, `email`, `birth`,
  `message`, `prompt`, `response`, `child`, `parent`;
- variables locales de frames;
- breadcrumbs HTTP.

Permitir solo ruta normalizada, método, status, release, environment y
`errorCode`.

## Mixpanel

El distinct ID es aleatorio y revocable. Un mapping interno permite borrarlo,
pero nunca se registra. Cada payload incluye `ip: 0`.

El catálogo está en `.kiro/docs/observabilidad-y-privacidad.md`; ese documento
forma parte del contrato.

## Dashboards

- **API:** requests, 4xx/5xx, latencia, cold start, throttles.
- **Juego:** emitidos, aceptados, duplicados, fallback y guardrails en agregados.
- **Dependencias:** DynamoDB, Bedrock, Mixpanel/Sentry dropped.
- **Costo:** consumo y presupuesto.

## Retención

Definir en Terraform por ambiente. Los proveedores externos deben documentar
residencia y período antes de activar `prod`. Si el plan gratuito no permite una
retención suficientemente corta, no enviar datos que puedan identificar ni
singularizar a un niño.

