# Seguridad infantil — límites innegociables

> Steering global. Es la parte del producto que **contamos como fortaleza en el
> video**, no como limitación. Cualquier cambio a este archivo se discute con el
> equipo completo antes de tocar código.

## 1. Alcance temático cerrado

El juego cubre **estafas y fraudes**: monedas gratis, sorteos falsos, robo de
cuenta, archivos con virus, links tramposos, suplantación de un amigo.

Queda **fuera, siempre**:

- Acoso, grooming, depredadores, "extraños peligrosos".
- Contenido sexual, romántico o corporal de cualquier tipo.
- Violencia, autolesión, drogas.
- Manipulación emocional personal (aislar al niño de su familia, secretos).

Razón: simular a un adulto que manipula emocionalmente a un niño es un riesgo
real, no un ejercicio educativo. Elegimos un dominio acotado donde la simulación
enseña sin exponer.

## 2. El LLM corre en el dispositivo del niño

Plan A es la Prompt API de Chrome (Gemini Nano, on-device): **ningún dato del
niño sale del navegador**. El fallback a Lambda solo envía el `escenarioId` y lo
que el propio niño escribió en el chat simulado — nunca nombre, edad, ubicación
ni identificador de dispositivo.

## 3. Doble capa de contención

| Capa | Archivo | Qué hace |
|---|---|---|
| Prompt | `src/llm/prompts.ts` | Acota el personaje, prohíbe temas, limita el largo |
| Filtro de salida | `src/llm/guardrails.ts` | Revisa la respuesta del modelo y la reemplaza por guion seguro si toca un tema prohibido |
| Filtro servidor | `infra/lambda/estafador/index.mjs` | Mismo system prompt, independiente del cliente |

El filtro asume que el prompt puede fallar. Nunca se elimina "porque el modelo ya
se porta bien".

## 4. El estafador se rinde

Si el niño dice que no, que va a bloquear o que le va a contar a un adulto, el
personaje insiste **una sola vez** de forma leve y se rinde. Enseñamos que cortar
funciona. Un estafador que insiste infinito enseña impotencia.

Límite duro: `MAX_TURNOS_CHAT = 4` turnos del niño por escenario.

## 5. Cero recolección de datos

- Sin login, sin nombre, sin correo, sin edad.
- Sin analítica de terceros, sin píxeles, sin cookies de tracking.
- El puntaje, si se guarda, va a `localStorage` del propio dispositivo.
- Si en el futuro entra DynamoDB, guarda puntaje anónimo y nada más.

## 6. Módulo de reglas de oro

El juego termina reforzando dos reglas que el niño se lleva:

1. Nadie de verdad te pide tu contraseña ni el código que llega a tu celular.
2. Si un mensaje te incomoda o te apura, **cuéntaselo a un adulto de confianza**.

## 7. Qué hacer si el modelo se sale del guion en la demo

La respuesta filtrada se marca internamente (`filtrada: true`) y se reemplaza por
una frase de guion. En el video, si pasa, se muestra: es evidencia de que la
contención funciona.

## Checklist de revisión antes de entregar

- [ ] Ningún escenario del banco toca los temas prohibidos.
- [ ] `npm run test` pasa en `src/test/guardrails.test.ts`.
- [ ] La Lambda no loguea el contenido del chat.
- [ ] No hay API keys en `src/`.
- [ ] `ORIGEN_PERMITIDO` de la Lambda apunta al dominio real, no a `*`.
