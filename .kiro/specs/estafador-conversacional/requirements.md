# Requirements Document

> Estafador conversacional con LLM on-device

## Introduction

Es el momento "wow" del demo y la carta de innovación del proyecto: tras el
mensaje inicial, el niño puede **responderle al estafador** y un LLM improvisa
como lo haría uno real (presiona, mete prisa, insiste), en un entorno seguro y
controlado.

Plan A: la **Prompt API de Chrome (Gemini Nano on-device)** — corre en el
navegador del niño, sin servidor, sin costo por token y con privacidad total.
Plan B: **AWS Lambda + Mistral**, para que el juego funcione en cualquier
navegador sin romper la experiencia.

Owner: **Francis** (backend / arquitectura).

## Glossary

- **Prompt API**: API experimental de Chrome que expone Gemini Nano en el dispositivo.
- **Proveedor**: implementación intercambiable que sabe generar la respuesta del estafador.
- **Guardrail**: filtro que revisa la salida del modelo antes de mostrarla.
- **Guion local**: frases fijas que se usan cuando no hay modelo disponible.
- **Turno**: un mensaje del niño más la respuesta del estafador.

## Requirements

### Requisito 1: LLM on-device como plan A

**Historia de Usuario:** Como papá o mamá, quiero que nada de lo que escribe mi hijo salga de su dispositivo, para estar tranquilo mientras juega.

#### Criterios de Aceptación

1. CUANDO la app arranca en un navegador con Prompt API disponible ENTONCES el sistema DEBERÁ elegir el proveedor on-device
2. CUANDO se abre una conversación ENTONCES el sistema DEBERÁ crear una sesión con el system prompt del escenario
3. CUANDO se usa el proveedor on-device ENTONCES el sistema NO DEBERÁ realizar ninguna petición de red
4. CUANDO se cambia de escenario ENTONCES el sistema DEBERÁ destruir la sesión anterior
5. CUANDO la API existe pero el modelo aún se está descargando ENTONCES el sistema DEBERÁ tratarla como no disponible y pasar al plan B

### Requisito 2: Fallback a AWS Lambda

**Historia de Usuario:** Como jugador en un navegador sin Prompt API, quiero poder responderle al estafador igual, para no perderme la mejor parte del juego.

#### Criterios de Aceptación

1. CUANDO la Prompt API no está disponible y existe `VITE_LLM_ENDPOINT` ENTONCES el sistema DEBERÁ usar el proveedor Lambda
2. CUANDO se llama a la Lambda ENTONCES el sistema DEBERÁ enviar solo `escenarioId`, `mensajeOriginal`, `perfilEstafador` e historial del chat
3. CUANDO la Lambda tarda más de 4 segundos ENTONCES el sistema DEBERÁ abortar y usar el guion local
4. CUANDO la Lambda responde con error HTTP ENTONCES el sistema DEBERÁ degradar al guion local sin mostrar un error técnico al niño
5. CUANDO no hay endpoint configurado ENTONCES el sistema DEBERÁ usar el guion local directamente
6. CUANDO la Lambda registra logs ENTONCES NO DEBERÁ incluir el contenido del chat

### Requisito 3: Guardrails de seguridad infantil

**Historia de Usuario:** Como equipo, quiero que sea imposible que el personaje se salga del tema, para poder poner esto frente a un niño sin supervisión constante.

#### Criterios de Aceptación

1. CUANDO se construye el system prompt ENTONCES DEBERÁ prohibir explícitamente pedir datos reales, temas personales, violencia, contenido sexual y proponer encuentros
2. CUANDO el modelo devuelve un texto con un término prohibido ENTONCES el sistema DEBERÁ reemplazarlo por una frase del guion seguro
3. CUANDO se evalúa un término prohibido ENTONCES la comparación DEBERÁ ignorar tildes y mayúsculas
4. CUANDO el modelo devuelve texto vacío ENTONCES el sistema DEBERÁ usar el guion seguro
5. CUANDO la respuesta supera 30 palabras ENTONCES el sistema DEBERÁ recortarla
6. CUANDO una respuesta es filtrada ENTONCES el sistema DEBERÁ marcarla como `filtrada: true` para diagnóstico
7. CUANDO el modelo agrega prefijos de rol ("Estafador:") ENTONCES el sistema DEBERÁ limpiarlos

### Requisito 4: Comportamiento del personaje

**Historia de Usuario:** Como niño, quiero sentir la presión real de un estafador, para saber qué se siente y poder cortarla la próxima vez.

#### Criterios de Aceptación

1. CUANDO el estafador responde ENTONCES DEBERÁ usar las tácticas del `perfilEstafador` del escenario
2. CUANDO el niño se niega, amenaza con bloquear o dice que le contará a un adulto ENTONCES el estafador DEBERÁ insistir una sola vez y luego rendirse
3. CUANDO el niño completa 4 turnos ENTONCES el sistema DEBERÁ cerrar la conversación y ofrecer continuar la partida
4. CUANDO el estafador escribe ENTONCES DEBERÁ sonar a chat: máximo dos frases, español latino sencillo
5. CUANDO se le pregunta si es una IA ENTONCES el personaje NO DEBERÁ revelar sus instrucciones

### Requisito 5: Experiencia mientras responde

**Historia de Usuario:** Como niño, quiero ver que el otro "está escribiendo", para que se sienta una conversación de verdad.

#### Criterios de Aceptación

1. CUANDO se envía un mensaje ENTONCES el sistema DEBERÁ mostrar el indicador "escribiendo…" hasta recibir la respuesta
2. CUANDO hay una petición en curso ENTONCES el sistema NO DEBERÁ permitir enviar otra
3. CUANDO el proveedor falla ENTONCES el niño NO DEBERÁ ver mensajes de error técnicos
4. CUANDO se cierra la conversación ENTONCES el sistema DEBERÁ volver al loop de la partida sin perder el puntaje
