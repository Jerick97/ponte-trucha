# Implementation Plan: Estafador conversacional

## Overview

Owner: **Francis**. Es la carta de innovación del proyecto: sin esto el juego es
un quiz bonito. Se integra el día 5 según el plan del brief.

Tareas centrales: 10 · Opcionales: 3 · Estimado: 1 noche + ajustes.

## Tasks

### Fase 1: Contrato y contención

- [x] 1. Definir la interfaz común de proveedores
  - Crear `src/llm/tipos.ts` con `ProveedorLlm`, `TurnoChat`, `RespuestaEstafador`
  - _Requisitos: 1.1, 2.1_

- [x] 2. Escribir los prompts del personaje
  - `src/llm/prompts.ts` con las siete reglas duras y el perfil del escenario
  - _Requisitos: 3.1, 4.1, 4.4, 4.5_

- [x] 3. Implementar los guardrails de salida
  - `src/llm/guardrails.ts`: limpieza, normalización sin tildes, lista de términos
    prohibidos, guion seguro, recorte a 30 palabras
  - _Requisitos: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 4. Pruebas de los guardrails
  - `src/test/guardrails.test.ts` con casos de datos personales, encuentro,
    tildes, vacío, prefijo de rol y presión normal
  - _Requisitos: 3.2, 3.3, 3.4, 3.7_

### Fase 2: Plan A on-device

- [x] 5. Implementar `ProveedorPromptApi`
  - Detección de `globalThis.LanguageModel` y `availability()`
  - Sesión con system prompt, reutilizada dentro del escenario
  - _Requisitos: 1.1, 1.2, 1.3, 1.5_

- [ ] 6. Manejar el ciclo de vida de la sesión
  - Llamar a `cerrar()` al cambiar de escenario desde el store
  - _Requisitos: 1.4_

- [ ] 7. Verificar en Chrome real
  - Activar la Prompt API, jugar un escenario completo, confirmar cero peticiones
    de red en la pestaña Network
  - _Requisitos: 1.3_

### Fase 3: Plan B en AWS

- [x] 8. Implementar `ProveedorLambda`
  - `fetch` con `AbortSignal.timeout(4000)` y degradación silenciosa
  - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 9. Escribir la Lambda del estafador
  - `infra/lambda/estafador/index.mjs` con el mismo system prompt
  - Sin loguear contenido del chat; historial recortado a 8 turnos
  - _Requisitos: 2.2, 2.6, 3.1_

- [ ] 10. Desplegar la Lambda y su Function URL
  - Variables `MISTRAL_API_KEY` y `ORIGEN_PERMITIDO`
  - Concurrencia reservada en 5 para acotar costo
  - Poner la URL en `.env.local` como `VITE_LLM_ENDPOINT`
  - _Requisitos: 2.1, 2.6_

### Fase 4: Integración con el juego

- [x] 11. Selector de proveedor
  - `src/llm/index.ts`: prueba en orden y memoiza la elección
  - _Requisitos: 1.1, 2.1, 2.5_

- [x] 12. Cablear la conversación al store
  - `enviarMensajeAlEstafador` con bloqueo de envío concurrente
  - Límite de 4 turnos del niño
  - _Requisitos: 4.3, 5.2_

- [ ] 13. Pulir la UI del chat
  - Indicador "escribiendo…", cierre de conversación, vuelta al loop
  - _Requisitos: 5.1, 5.3, 5.4_

- [ ] 14*. Badge de diagnóstico
  - Mostrar el `origen` de la respuesta en modo desarrollo (útil para el video)
  - _Requisitos: 3.6_

- [ ] 15*. Ajustar la rendición del personaje
  - Detectar negativa del niño en el historial y forzar el cierre suave
  - _Requisitos: 4.2_

- [ ] 16*. Medir latencia on-device vs Lambda
  - Dato concreto para el video ("X ms sin salir del dispositivo")
  - _Requisitos: 1.3_
