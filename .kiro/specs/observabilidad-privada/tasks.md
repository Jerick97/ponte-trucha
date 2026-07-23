# Tareas — Observabilidad privada

> Todas pendientes; implementar después del esqueleto de backend.

- [ ] 1. Aprobar catálogo de eventos, propiedades y métricas
  - _Requisitos: R1, R4, R6_
- [ ] 2. Escribir tests de logging estructurado sin PII
  - _Requisitos: R1, R6_
- [ ] 3. Implementar Powertools Logger/Metrics/Tracer
  - _Requisitos: R1_
- [ ] 4. Crear dashboards, alarmas, presupuesto y runbooks con Terraform tests
  - _Requisitos: R2_
- [ ] 5. Escribir tests del scrubber Sentry con datos señuelo
  - _Requisitos: R3, R6_
- [ ] 6. Implementar adapter Sentry detrás de feature flag
  - _Requisitos: R3, R5_
- [ ] 7. Validar manualmente en `dev` que Sentry no recibió PII
  - _Requisitos: R3_
- [ ] 8. Escribir tests de `NullAnalytics`, consentimiento y allowlist
  - _Requisitos: R4, R5, R6_
- [ ] 9. Implementar AnalyticsPort y adapter Mixpanel server-side
  - _Requisitos: R4, R5_
- [ ] 10. Probar caída/timeout de Sentry y Mixpanel
  - _Requisitos: R5_
- [ ] 11. Implementar revocación y borrado del ID analítico
  - _Requisitos: R4, R6_
- [ ] 12. Documentar residencia, retención, owners y respuesta a incidentes
  - _Requisitos: R2, R6_

Siguiente responsable: **Francis**. Clau revisa nombres/interpretación de
métricas de producto antes de habilitar Mixpanel.

