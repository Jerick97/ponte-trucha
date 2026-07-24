# ADR-005 — Bedrock deshabilitado hasta verificar retención cero

- **Estado:** aceptado para el MVP inicial
- **Fecha:** 2026-07-24
- **Owner:** Francis
- **Requisitos:** backend-serverless R6 y R8

## Decisión

La generación con Bedrock queda deshabilitada por defecto. `api-ia` se crea solo
como límite lógico de tiempo, concurrencia e IAM, sin permisos de invocación ni
rutas públicas mientras no se aprueben modelo, región y evidencia de retención
cero compatibles con el producto.

Cuando IA esté deshabilitada, cada reto usa únicamente el banco curado. No se
persiste ni registra prompt, respuesta, historial de chat, IDs de cuenta o texto
libre infantil.

## Consecuencias

- El loop funciona sin un proveedor externo de IA.
- Activar Bedrock requiere un ADR complementario con modelo y región concretos,
política de retención, IAM restringido, flag, kill switch y pruebas de guardrails.
