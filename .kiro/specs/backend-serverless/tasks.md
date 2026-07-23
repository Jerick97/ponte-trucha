# Tareas — Backend serverless

> Plan de implementación para Kiro. Todas están pendientes.

## Fase 0 — Decisiones y contrato

- [ ] 1. Resolver ADR-001 a ADR-005 y registrar trade-offs
  - _Requisitos: R1, R2, R6, R8_
- [ ] 2. Definir access patterns y diagrama físico DynamoDB
  - _Requisitos: R2, R4_
- [ ] 3. Diseñar OpenAPI 3.1 con ejemplos sanitizados y RFC 9457
  - _Requisitos: R7_

## Fase 1 — Setup con TDD

- [ ] 4. Crear estructura backend y toolchain aprobada sin lógica
  - _Requisitos: R1, R7_
- [ ] 5. Configurar pytest, coverage, lint y type checking en CI
  - _Requisitos: R7_
- [ ] 6. Escribir tests de arquitectura que impidan imports inválidos
  - _Requisitos: R7_

## Fase 2 — Dominio

- [ ] 7. Escribir tests rojos de Challenge/Attempt/Progress
  - _Requisitos: R3, R4_
- [ ] 8. Implementar el mínimo y refactorizar dominio
  - _Requisitos: R3, R4_
- [ ] 9. Escribir tests rojos de factories para las cuatro apps
  - _Requisitos: R3_
- [ ] 10. Implementar registry, factories y schemas
  - _Requisitos: R3_
- [ ] 11. Escribir tests de Strategy/Specification de adaptación
  - _Requisitos: R5_
- [ ] 12. Implementar adaptación determinista y reason codes
  - _Requisitos: R5_
- [ ] 13. Escribir e implementar guardrails con fallback curado
  - _Requisitos: R6_

## Fase 3 — Aplicación y adapters

- [ ] 14. Implementar casos de uso con repositories falsos
  - _Requisitos: R2, R3, R4_
- [ ] 15. Crear adapters DynamoDB con contract tests
  - _Requisitos: R2_
- [ ] 16. Implementar transacción e idempotencia del intento
  - _Requisitos: R4_
- [ ] 17. Crear adapter Bedrock y pruebas de retención/guardrails
  - _Requisitos: R6_
- [ ] 18. Crear entrypoint FastAPI/Web Adapter y tests HTTP
  - _Requisitos: R1, R7_

## Fase 4 — Terraform y despliegue dev

- [ ] 19. Crear módulos Terraform con tests para API, Lambda y DynamoDB
  - _Requisitos: R1, R2, R8_
- [ ] 20. Aplicar IAM mínimo, límites, cifrado, TTL y logs con retención
  - _Requisitos: R2, R8_
- [ ] 21. Ejecutar plan revisado y desplegar únicamente a `dev`
  - _Requisitos: R8_
- [ ] 22. Ejecutar integration/E2E y pruebas de seguridad en `dev`
  - _Requisitos: R1-R8_

## Fase 5 — Integración

- [ ] 23. Generar/validar cliente TypeScript desde OpenAPI
  - _Requisitos: R7_
  - _Coordinación: toca contratos compartidos; avisar a Jerick_
- [ ] 24. Integrar el loop frontend con retos/intentos/progreso remoto
  - _Requisitos: R3, R4, R5_
  - _Coordinación: toca UI/store de Jerick y lógica de Clau_
- [ ] 25. Ejecutar gate de lanzamiento del PRD y actualizar documentación
  - _Requisitos: R1-R8_

Siguiente responsable: **Francis** en tarea 1. Jerick participa desde 23 y Clau
aprueba contratos de escenarios/score antes de 24.

