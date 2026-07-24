# ADR-004 — Analítica desacoplada y apagada por defecto

- **Estado:** aceptado para el MVP inicial
- **Fecha:** 2026-07-24
- **Owner:** Francis
- **Requisitos:** backend-serverless R8; observabilidad-privada R4 y R5

## Decisión

El backend inicia con `NullAnalytics`. No se configura Mixpanel, identificador
analítico ni credenciales de proveedor. Los casos de uso solo podrán emitir
eventos de dominio tipados cuando exista consentimiento `productAnalytics`
vigente y un catálogo aprobado.

El adapter futuro se implementará fuera del camino crítico, con `ip: 0`, un ID
aleatorio revocable, timeout corto y borrado explícito al revocar. Su falla no
revierte un reto, un intento ni el progreso.

## Consecuencias

- La primera infraestructura no transmite datos a terceros.
- Activar Mixpanel requiere actualizar el catálogo, pruebas de allowlist,
retención/residencia y el mecanismo de borrado antes de cambiar el flag.
