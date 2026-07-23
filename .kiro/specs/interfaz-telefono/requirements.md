# Requirements Document

> Interfaz del teléfono simulado (iPhone con apps)

## Introduction

Reconstrucción de la capa de presentación del juego: en lugar de un marco de
chat genérico, el niño ve un **iPhone simulado completo** con animación de
encendido, pantalla de bloqueo, parte trasera visible al girarlo, home screen,
apps (WhatsApp, Mensajes/SMS, Discord, Gmail y el chat del juego) y
notificaciones. La partida se vuelve inmersiva: cada escenario llega como una
notificación que el niño toca para abrir la app correspondiente, donde decide
**¿trampa o de confianza?**.

**Referencia visual**: CodePen "CSS Interactive iPhone 12 iOS 14" de Jorge
Aguilar (https://codepen.io/JorgeAguilar/pen/MWeXVZg). Se toma como referencia
de comportamiento y estética (encendido, giro, bloqueo), **no** se copia su
código: el original usa jQuery y SCSS; aquí se reimplementa en React +
Tailwind con design tokens, sin dependencias nuevas y sin recursos externos
(audios o imágenes remotas).

Esta spec **reconstruye la UI desde cero** (se reemplazan los componentes de
`src/components/`) pero **conserva intactos** el motor (`src/game/`), el store
(`src/store/`), el LLM (`src/llm/`) y los tipos (`src/types/`), salvo la
ampliación puntual del canal `correo` (campos opcionales de dirección y
asunto). Absorbe la tarea 8 pendiente de la spec `loop-de-juego`
(tratamiento visual por canal).

Las reglas de juego (puntaje, rachas, feedback, nivel de trucha) siguen
definidas en la spec `loop-de-juego`; aquí solo cambia **cómo se ven y dónde
ocurren**.

Owner principal: Jerick (UI). La ampliación del canal `correo` toca
`src/data/` y `src/types/`: coordinar con Clau antes de implementarla.

## Glossary

- **Teléfono simulado**: marco visual que imita un iPhone (bordes, botones laterales, notch, parte trasera) dentro del cual ocurre todo el juego.
- **Animación de encendido**: secuencia de arranque del teléfono: entra a escena, gira al frente, muestra el logo y revela la pantalla de bloqueo.
- **Pantalla de bloqueo**: pantalla con hora y fecha que aparece al encender o bloquear el teléfono; se desliza hacia arriba para desbloquear.
- **Parte trasera**: cara posterior del teléfono (cámaras, logo) visible al girarlo.
- **Home screen**: pantalla inicial del teléfono con wallpaper, grid de íconos de apps y dock.
- **App simulada**: recreación visual de una app real (WhatsApp, Mensajes, Discord, Gmail) o del chat del juego, con su identidad visual propia.
- **Canal**: campo del escenario que indica por qué app llega el mensaje: `whatsapp`, `sms`, `discord`, `chat-juego` o `correo` (ya existe en el contrato; lo renderiza la app Gmail).
- **Notificación**: aviso visual (banner + badge en el ícono) que anuncia la llegada del mensaje de un escenario.
- **Badge**: contador rojo sobre el ícono de una app que indica mensajes sin abrir.
- **Status bar**: franja superior del teléfono con hora, señal y batería simuladas.

## Requirements

### Requisito 1: Marco físico y animación de encendido

**Historia de Usuario:** Como niño, quiero que al empezar el juego el celular se encienda de verdad, con su logo y todo, para sentir que me acaban de dar un teléfono real.

#### Criterios de Aceptación

1. CUANDO la app carga ENTONCES el sistema DEBERÁ renderizar un marco de iPhone de máximo 420 px de ancho, centrado, con esquinas redondeadas, notch, botones laterales simulados y sin scroll horizontal
2. CUANDO comienza la animación de encendido ENTONCES el teléfono DEBERÁ entrar a escena mostrando su parte trasera y girar hacia el frente
3. CUANDO el teléfono queda de frente ENTONCES el sistema DEBERÁ mostrar el logo de arranque sobre pantalla oscura y luego ampliarlo hasta revelar la pantalla de bloqueo
4. CUANDO la animación de encendido termina ENTONCES el sistema DEBERÁ dejar al niño en la pantalla de bloqueo, listo para desbloquear
5. CUANDO el usuario tiene `prefers-reduced-motion` activo ENTONCES el sistema DEBERÁ saltar la animación y mostrar directamente la pantalla de bloqueo

### Requisito 2: Pantalla de bloqueo y botón de apagado

**Historia de Usuario:** Como niño, quiero bloquear el celular con su botón lateral y desbloquearlo deslizando, como en un iPhone de verdad, para que el juego se sienta como mi teléfono.

#### Criterios de Aceptación

1. CUANDO se muestra la pantalla de bloqueo ENTONCES el sistema DEBERÁ mostrar hora y fecha simuladas sobre el wallpaper
2. CUANDO el niño desliza hacia arriba (o toca el control de desbloqueo) ENTONCES el sistema DEBERÁ desbloquear y mostrar el home screen
3. CUANDO el niño presiona el botón lateral de apagado ENTONCES el sistema DEBERÁ bloquear el teléfono y volver a la pantalla de bloqueo
4. CUANDO el teléfono se bloquea en medio de una partida ENTONCES el sistema DEBERÁ conservar el estado de la partida y, al desbloquear, volver a donde estaba
5. CUANDO se desbloquea con teclado ENTONCES el sistema DEBERÁ ofrecer un control alcanzable con `Tab` equivalente al gesto de deslizar

### Requisito 3: Parte trasera y giro del teléfono

**Historia de Usuario:** Como niño, quiero girar el celular y ver su parte de atrás con las cámaras, porque explorar el teléfono hace que se sienta un objeto real y no un dibujo.

#### Criterios de Aceptación

1. CUANDO el niño activa el control de girar ENTONCES el sistema DEBERÁ rotar el teléfono 180° mostrando la parte trasera (cámaras y logo)
2. CUANDO el teléfono está mostrando la parte trasera ENTONCES el sistema DEBERÁ permitir volver al frente con el mismo control
3. CUANDO el teléfono está girado ENTONCES el sistema NO DEBERÁ perder el estado de la pantalla frontal ni de la partida
4. CUANDO el usuario tiene `prefers-reduced-motion` activo ENTONCES el giro DEBERÁ resolverse sin animación (cambio directo de cara)

### Requisito 4: Home screen del iPhone simulado

**Historia de Usuario:** Como niño, quiero ver la pantalla de inicio de un celular de verdad, con sus apps y su hora, para sentir que estoy en un teléfono real y no en una tarea del colegio.

#### Criterios de Aceptación

1. CUANDO se desbloquea el teléfono ENTONCES el sistema DEBERÁ mostrar el home screen con wallpaper, grid de íconos y dock
2. CUANDO se muestra cualquier pantalla frontal ENTONCES el sistema DEBERÁ mostrar una status bar con hora, señal y batería simuladas
3. CUANDO se muestra el home screen ENTONCES el sistema DEBERÁ mostrar al menos las apps de los canales del banco: WhatsApp, Mensajes (SMS), Discord, Gmail y el chat del juego
4. CUANDO el niño toca un ícono de app sin notificación pendiente ENTONCES el sistema DEBERÁ abrir la app en estado vacío o con conversaciones ya resueltas, sin romper el flujo de la partida
5. CUANDO se renderiza el home screen ENTONCES cada ícono DEBERÁ tener un área táctil mínima de 44×44 px

### Requisito 5: Notificaciones que dirigen la partida

**Historia de Usuario:** Como niño, quiero que los mensajes me lleguen como notificaciones que yo abro, para decidir por mí mismo a qué mensaje entrar, como pasa en mi celular.

#### Criterios de Aceptación

1. CUANDO la fase es `mensaje` ENTONCES el sistema DEBERÁ mostrar en el home una notificación del escenario actual: banner con remitente y vista previa recortada, más badge en el ícono de la app del canal
2. CUANDO el niño toca el banner o el ícono con badge ENTONCES el sistema DEBERÁ abrir la app del canal mostrando el mensaje completo del escenario
3. CUANDO el escenario aún no se responde ENTONCES el sistema NO DEBERÁ mostrar notificaciones de otros escenarios (una notificación activa a la vez)
4. CUANDO el niño termina el feedback (o el chat) de un escenario ENTONCES el sistema DEBERÁ volver al home screen y mostrar la notificación del siguiente escenario
5. CUANDO se responde el último escenario ENTONCES el sistema DEBERÁ pasar a la pantalla de resultado según la spec `loop-de-juego`

### Requisito 6: Identidad visual por app

**Historia de Usuario:** Como niño, quiero que cada app se vea como la app de verdad (WhatsApp verde, Discord oscuro, Gmail como correo), para practicar a detectar estafas en el mismo lugar donde me llegarían.

#### Criterios de Aceptación

1. CUANDO se abre la app de un canal ENTONCES el sistema DEBERÁ aplicar la identidad visual de ese canal: colores, header, tipografía y forma de las burbujas o del correo
2. CUANDO el canal es `whatsapp`, `sms`, `discord` o `chat-juego` ENTONCES el sistema DEBERÁ mostrar el mensaje como burbuja entrante en una vista de conversación
3. CUANDO el canal es `gmail` ENTONCES el sistema DEBERÁ mostrar el mensaje como correo: remitente con dirección, asunto y cuerpo, no como burbuja
4. CUANDO se muestra el header de la app ENTONCES el sistema DEBERÁ mostrar nombre, avatar y si la cuenta aparece como "verificada", según los datos del escenario
5. CUANDO se renderiza cualquier app ENTONCES los colores DEBERÁN salir de design tokens declarados en `@theme` (`src/index.css`), nunca de valores crudos en los componentes

### Requisito 7: El loop de juego ocurre dentro de la app

**Historia de Usuario:** Como niño, quiero decidir y recibir la explicación sin salir de la app donde me llegó el mensaje, para no perder el hilo de lo que estoy aprendiendo.

#### Criterios de Aceptación

1. CUANDO la fase es `mensaje` y la app está abierta ENTONCES el sistema DEBERÁ mostrar los dos botones "Es trampa" y "De confianza" dentro del contexto visual de la app
2. CUANDO la fase es `feedback` ENTONCES el sistema DEBERÁ resaltar las señales delatoras y mostrar la lección dentro de la misma vista de la app, cumpliendo los requisitos 3.x de la spec `loop-de-juego`
3. CUANDO el escenario permite conversación ENTONCES el sistema DEBERÁ ofrecer el chat con el estafador dentro de la misma app del canal
4. CUANDO la fase es `mensaje` o `feedback` ENTONCES el sistema DEBERÁ mantener visibles ronda actual, puntaje y racha (HUD) sin tapar el contenido de la app
5. CUANDO cambia la fase ENTONCES el sistema NO DEBERÁ recargar la página ni perder el estado de la partida

### Requisito 8: Canal correo (app Gmail) en el banco de escenarios

**Historia de Usuario:** Como niño, quiero practicar también con correos falsos, porque las estafas por correo (premios, "tu cuenta será suspendida") también me pueden llegar.

#### Criterios de Aceptación

1. CUANDO se muestra un escenario de canal `correo` ENTONCES el sistema DEBERÁ renderizarlo en la app Gmail (el canal ya existe en el contrato; NO se agrega un canal `gmail` duplicado)
2. CUANDO el canal es `correo` ENTONCES el escenario DEBERÁ poder incluir la dirección de correo del remitente y un asunto, como campos nuevos en `src/types/escenario.ts` y `src/data/escenarios.schema.json`
3. CUANDO se amplía el contrato ENTONCES el banco DEBERÁ incluir al menos un escenario de correo para poder probar la app Gmail
4. CUANDO se modifica el banco o su schema ENTONCES `npm run validar:escenarios` DEBERÁ pasar en verde

### Requisito 9: Accesibilidad y rendimiento

**Historia de Usuario:** Como niño con un celular modesto, quiero que el teléfono simulado cargue rápido y se pueda usar con teclado o lector de pantalla, para que nadie se quede fuera.

#### Criterios de Aceptación

1. CUANDO se navega solo con teclado ENTONCES el sistema DEBERÁ permitir completar una partida entera: desbloquear, abrir la notificación, decidir, leer el feedback y continuar
2. CUANDO llega una notificación ENTONCES el sistema DEBERÁ anunciarla con `aria-live="polite"`
3. CUANDO el usuario tiene `prefers-reduced-motion` activo ENTONCES el sistema DEBERÁ desactivar las animaciones de encendido, giro, apertura de apps y llegada de notificaciones
4. CUANDO se mide el contraste de texto en cualquier app simulada ENTONCES DEBERÁ cumplir WCAG 2.2 AA (4.5:1 en texto normal), incluso sobre los colores de marca de cada app
5. CUANDO la app se compila ENTONCES el bundle inicial DEBERÁ mantenerse por debajo de 200 KB comprimido, sin cargar audios ni imágenes desde servidores externos

### Requisito 10: Conservación de la lógica existente

**Historia de Usuario:** Como equipo, queremos reconstruir la UI sin tocar las reglas del juego, para no romper lo que ya está probado y en verde.

#### Criterios de Aceptación

1. CUANDO se reconstruye la capa de componentes ENTONCES el sistema NO DEBERÁ modificar `src/game/` ni las reglas de puntaje del store
2. CUANDO se termina la reconstrucción ENTONCES `npm run test` DEBERÁ seguir en verde con los tests existentes de motor y guardrails
3. CUANDO un componente nuevo necesita datos o acciones ENTONCES DEBERÁ recibirlos por props desde `App.tsx`, respetando las reglas de capas de `.kiro/steering/arquitectura.md`
4. CUANDO se agrega lógica pura nueva (estados del teléfono, mapeo canal→app, secuencia de notificaciones) ENTONCES DEBERÁ escribirse primero su test (TDD) antes de la implementación
