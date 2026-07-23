# RFC: Rediseño del contrato de escenarios y el motor de juego

> **Estado:** EN DISCUSIÓN — no implementado, no aprobado.
> **Dirección elegida:** Opción B (evolución aditiva). Ver §9 y §10.
> **Rama sugerida:** `rfc/contrato-escenarios-v2`
> **Autores:** propuesta del equipo + revisión asistida (Kiro).
> **Áreas que deben validar:** Arquitectura (Francis) y Front (Jerick), con Contenido (Clau) para el banco.
> **Specs relacionadas (ya implementadas):** `banco-escenarios`, `loop-de-juego`, `estafador-conversacional`, `interfaz-telefono`.

> **Nota (actualización):** las §1–§8 son el análisis original de la propuesta.
> La §9 documenta el avance de Jerick (`interfaz-telefono`, ya en `main`) y la
> §10 concreta el plan de enriquecimiento aditivo que el equipo decidió seguir:
> **enriquecer sin romper**. Si hay conflicto entre §2 (propuesta original) y §10,
> manda la §10.

## 1. Para qué sirve este documento

Se planteó una propuesta nueva para el contrato de datos de los escenarios, el
flujo de partida y el cálculo de puntaje. Esa propuesta se superpone con specs
que **ya están implementadas** en el repo. Este documento no decide nada: reúne
todo para que el equipo valide en una reunión. En concreto:

1. Deja registrada la propuesta original tal cual se planteó.
2. Documenta qué existe hoy en el código (verificado archivo por archivo).
3. Señala dónde la propuesta coincide, difiere o entra en conflicto con lo
   implementado y con el steering (`arquitectura.md`, `seguridad-infantil.md`,
   `estandares-de-codigo.md`).
4. Presenta las opciones de alcance para elegir.
5. Lista las preguntas abiertas para Front y Arquitectura.

Solo después de esta validación tiene sentido escribir specs formales
(`requirements.md` / `design.md` / `tasks.md`) y pasar a implementar.

## 2. Propuesta original (fuente única)

- Lógica pura en `src/game/` (motor, estafador, validador), sin React ni DOM.
- Máquina de estados:
  `inicio → jugando → feedback → siguiente() → jugando → … → resultado`,
  con una rama opcional `chat` cuando el escenario es estafa y tiene chat habilitado.
- API mínima propuesta para la UI:

  ```ts
  let estado = iniciarPartida(banco);
  estado = responder(estado, "trampa", 2400);       // incluye tiempo de respuesta
  if (puedeChatear(estado)) estado = abrirChat(estado);
  estado = cerrarChat(estado, "resistio");
  estado = siguiente(estado);
  const resultado = calcularResultado(estado);
  ```

- Banco de 20 escenarios: 13 estafas + 7 legítimos (3 de las 8 rondas por partida
  son legítimos).
- Insignia **"Modo desconfiado"** si el niño marca 3+ mensajes legítimos como estafa.
- Puntaje: `(100 + bonusVelocidad(hasta 50, decae de 3s a 12s)) × multiplicadorRacha(hasta 2×)`.
- Bonus fijo de **150 puntos** por resistirle al estafador en el chat.
- Fallar corta la racha, nunca resta puntos.
- Solo 10 de 13 escenarios de estafa tienen chat habilitado.
- Seguridad infantil:
  - System prompt con **10 reglas** inquebrantables.
  - `revisarMensajeDelNino()` corre **antes** de enviar el mensaje del niño al
    modelo, detectando contraseña / teléfono / correo / dirección / colegio /
    documento / código.
  - Chat con techo de 4 turnos.
  - Prompt API on-device como plan A; Lambda como fallback.
  - **"El system prompt viaja desde el cliente — Lambda no lo reescribe."**
- Contrato de datos propuesto:

  ```ts
  {
    id, categoria, canal, contexto, dificultad: 1|2|3, esEstafa,
    remitente: { nombre, esVerificado },
    mensajes: [{ de: "ellos"|"yo", texto }],
    senales:  [{ fragmento, titulo, explicacion }],
    leccion, feedbackAcierto, feedbackError,
    chat: { habilitado, objetivo, tacticas[], maxTurnos }
  }
  ```

- Canales propuestos: `chat_juego`, `dm_juego`, `dm_discord`, `whatsapp`,
  `correo`, `sms`, `notificacion_juego`, `plataforma_colegio`.
- Validador: falla si un `fragmento` no existe literal, si un legítimo tiene chat,
  o si el banco baja de 5 legítimos.
- Lambda: recibe `{ system, historial }` y devuelve `{ respuesta }`.

## 3. Estado actual del código (verificado)

Rutas confirmadas en el repo:

| Pieza | Ruta real |
|---|---|
| Contrato de datos | `src/types/escenario.ts` |
| Motor puro | `src/game/motor.ts` |
| Nivel final | `src/game/nivelTrucha.ts` |
| Store | `src/store/usePartida.ts` |
| LLM | `src/llm/{tipos,prompts,guardrails,promptApi,lambdaClient,index}.ts` |
| Lambda fallback | `infra/lambda/estafador/index.mjs` |
| Banco + esquema | `src/data/escenarios.json`, `src/data/escenarios.schema.json` |

### 3.1 Contrato — `src/types/escenario.ts`

```ts
type CanalMensaje = 'chat-juego' | 'whatsapp' | 'correo' | 'discord' | 'sms';
type TipoEscenario = 'monedas-gratis' | 'sorteo-falso' | 'robo-de-cuenta'
  | 'hack-con-virus' | 'link-tramposo' | 'suplantacion-de-amigo' | 'legitimo';
type Veredicto = 'trampa' | 'confianza';
type Dificultad = 1 | 2 | 3;

interface SenalDelatora { fragmento: string; explicacion: string }         // sin "titulo"
interface Remitente { nombre: string; avatar: string; verificado: boolean }

interface Escenario {
  id: string;
  tipo: TipoEscenario;
  canal: CanalMensaje;
  dificultad: Dificultad;
  remitente: Remitente;
  mensaje: string;                 // UN solo mensaje, no array
  respuestaCorrecta: Veredicto;    // 'confianza' si y solo si tipo === 'legitimo'
  senales: SenalDelatora[];        // mínimo 1
  leccion: string;
  permiteConversacion: boolean;
  perfilEstafador?: { disfraz: string; tacticas: string[]; objetivo: string };
}
```

No existen hoy: `feedbackAcierto`, `feedbackError`, `contexto`, `esEstafa`,
`mensajes[]`, ni `titulo` en las señales.

### 3.2 Motor puro — `src/game/motor.ts`

- `RONDAS_POR_PARTIDA = 8`, `PUNTOS_ACIERTO = 100`, `BONUS_POR_RACHA = 25`,
  `MAX_BONUS_RACHA = 100`.
- `calcularPuntos(rachaPrevia) = 100 + min(rachaPrevia × 25, 100)` — **aditivo**,
  sin componente de velocidad.
- `armarRonda()`: cuota de legítimos = `max(1, round(totalRondas / 3))`, ordena
  por dificultad ascendente, aleatoriedad **inyectable** (`aleatorio: () => number`).
- `responder(estado, escenario, veredicto)`: inmutable, **sin** parámetro de tiempo.
- No existen `puedeChatear`, `abrirChat`, `cerrarChat`, `calcularResultado` como
  funciones del motor. Esas responsabilidades hoy están en el store
  (`usePartida.ts`) y en `nivelTrucha.ts`.

### 3.3 Nivel final — `src/game/nivelTrucha.ts`

- Cortes por **porcentaje de aciertos**: Súper trucha ≥90%, Trucha ≥70%,
  Ojo despierto ≥45%, Novato debajo.
- No existe la insignia "Modo desconfiado" ni el conteo de falsos positivos
  sobre legítimos.

### 3.4 Store — `src/store/usePartida.ts` (zustand)

- Fases: `inicio | mensaje | feedback | chat | resultado`. Coincide en espíritu
  con la máquina propuesta (con `mensaje` en vez de `jugando`).
- `MAX_TURNOS_CHAT = 4` **ya está implementado** — coincide con la propuesta.
- `enviarMensajeAlEstafador(texto)` arma el historial y llama al proveedor
  **directamente**: no hay un chequeo del dato que escribe el niño antes de
  enviarlo. `revisarMensajeDelNino()` no existe.
- El store no distingue "resistió" de "cedió" en el chat, ni el chat devuelve
  puntaje: hoy el LLM está desacoplado de la puntuación.

### 3.5 LLM — `src/llm/`

- `prompts.ts` tiene **7 reglas duras** en el system prompt (la propuesta menciona
  10; no especifica cuáles serían las 3 adicionales).
- `guardrails.ts` filtra **solo la salida** del modelo (`filtrarRespuesta`) contra
  una lista de términos prohibidos y recorta a `MAX_PALABRAS_RESPUESTA = 30`.
  **No** filtra la entrada del niño: ese es exactamente el hueco que cubriría
  `revisarMensajeDelNino()`.

### 3.6 Lambda — `infra/lambda/estafador/index.mjs` (verificado)

- Contrato de entrada real:
  `{ escenarioId, mensajeOriginal, perfilEstafador?, historial: [{autor, texto}] }`.
  **No** recibe un `system` del cliente.
- La Lambda **reconstruye su propio system prompt** con `construirSystemPrompt(perfil)`,
  con las mismas reglas duras que el cliente. Es una **segunda capa independiente**
  a propósito.
- Solo loguea `error.name`, nunca el contenido del chat.

### 3.7 Componentes que dependen del contrato actual

`Burbuja.tsx`, `TarjetaFeedback.tsx`, `ChatEstafador.tsx`, `Hud.tsx`,
`BarraDecision.tsx`, `MarcoTelefono.tsx`, `PantallaInicio.tsx`,
`PantallaResultado.tsx` y las vistas de `components/apps/`. Todos leen
`escenario.mensaje` (string único), `senales[].fragmento/explicacion` (sin
`titulo`), `permiteConversacion` y `leccion`. Ninguno espera `mensajes[]`,
`feedbackAcierto/Error` ni `chat.maxTurnos` a nivel de escenario.

## 4. Comparación campo por campo

| Aspecto | Implementado hoy | Propuesta | Impacto |
|---|---|---|---|
| Nombre categoría | `tipo: TipoEscenario` (7 valores cerrados) | `categoria` (sin enum definido) | Definir enum o quedarse sin validación fuerte |
| Es estafa | `respuestaCorrecta` derivado de `tipo` | `esEstafa: boolean` explícito | Redundante con `categoria`; elegir fuente de verdad |
| Cuerpo mensaje | `mensaje: string` (1 burbuja) | `mensajes: [{de,texto}]` (varias) | Cambia UI de fase mensaje y algoritmo de resaltado |
| Señal | `{fragmento, explicacion}` | `{fragmento, titulo, explicacion}` | Aditivo, bajo riesgo si `titulo` es opcional |
| Feedback | Se compone en UI por `tipo` + tono | `feedbackAcierto/feedbackError` por escenario | Más control de copy, pero duplica contenido en 20 escenarios |
| Chat | `permiteConversacion` + `perfilEstafador?` | `chat: {habilitado, objetivo, tacticas[], maxTurnos}` | Mismo fin, otra forma; `maxTurnos` por escenario vs. constante global |
| Canales | 5, kebab-case (`chat-juego`) | 8, snake_case (`chat_juego`) | Convención distinta + 3 canales sin tratamiento visual |
| Puntaje | `100 + min(racha×25,100)` aditivo | `(100 + velocidad≤50) × racha≤2×` | Cambia la curva; rompe tests del motor; `responder()` necesita el tiempo |
| Bonus resistir | No existe | +150 fijos | El chat hoy no devuelve puntaje al store |
| Insignia desconfiado | No existe | 3+ falsos positivos en legítimos | Requiere contar falsos positivos en `EstadoPartida` |
| Filtro entrada niño | No existe (solo salida) | `revisarMensajeDelNino()` | Mejora de seguridad real, sin conflicto: falta construirla |
| Reglas system prompt | 7 en `prompts.ts` | 10 mencionadas | Decidir si son 3 nuevas o otro conteo |
| System prompt → Lambda | Lambda arma el suyo (independiente) | "viaja desde el cliente" | **Conflicto con `seguridad-infantil.md`** (ver §5.1) |
| Banco | 20 esc., 13 estafa / 7 legítimo | Igual | Sin conflicto |
| Mínimo legítimos | Aviso si pocos | **Falla** si < 5 | Decidir aviso vs. error duro |

## 5. Conflictos con el steering (no negociables sin acuerdo del equipo)

### 5.1 System prompt del lado del servidor — CONFLICTO DURO

`seguridad-infantil.md`, capa 3, exige un **filtro servidor independiente del
cliente**: la Lambda arma su propio system prompt precisamente para que, si el
cliente es manipulado (alguien abre devtools y cambia el `system` antes de
enviarlo), el servidor siga acotado. El código actual (`index.mjs`) cumple esto:
recibe `perfilEstafador` y **reconstruye** el prompt, no confía en un `system`
del cliente.

La propuesta dice lo contrario: *"el system prompt viaja desde el cliente — Lambda
no lo reescribe"* y *"Lambda recibe `{ system, historial }`"*. Adoptar eso
**elimina la segunda capa de contención** y contradice el steering, que marca
cualquier cambio a `seguridad-infantil.md` como algo que se discute con el equipo
completo antes de tocar código. **Este punto solo se resuelve en la reunión.**

### 5.2 Convención de nombres de canal

El codebase usa kebab-case de forma consistente (`chat-juego`, `robo-de-cuenta`).
La propuesta introduce snake_case (`chat_juego`, `notificacion_juego`). Mezclar
las dos convenciones en el mismo dominio genera inconsistencia contra
`estandares-de-codigo.md`. Hay que unificar en una sola.

### 5.3 Motor puro y tiempo inyectado — SIN conflicto

`estandares-de-codigo.md` exige que toda aleatoriedad (y por extensión el tiempo)
entre como parámetro. Pasar el tiempo de respuesta a `responder(estado, v, ms)`
es compatible: la UI mide con `performance.now()` y lo inyecta; el motor no llama
a `Date.now()`. Solo falta implementarlo.

## 6. Opciones de alcance para decidir

**Opción A — Reemplazo completo.** Migrar contrato, motor, store y componentes
al diseño nuevo de una vez.
- Pro: contrato final más rico (feedback por escenario, mensajes múltiples, insignias).
- Contra: rompe 3 specs cerradas, obliga a reescribir los 20 escenarios, los tests
  del motor y 6+ componentes. Alto riesgo antes de la demo.

**Opción B — Evolución aditiva.** Mantener contrato y motor actuales; sumar solo
lo que aporta valor real sin romper lo que funciona:
- `revisarMensajeDelNino()` (seguridad, sin conflicto).
- Insignia "Modo desconfiado" (nuevo contador en `EstadoPartida`).
- Bonus de 150 por resistir (nuevo campo en el resultado del chat).
- `titulo` opcional en `SenalDelatora` (aditivo).
- Bonus de velocidad como término **adicional** a la fórmula aditiva, no como
  multiplicador (evita reescribir los tests del motor).
- Pro: cero regresión sobre lo validado; entregable incremental.
- Contra: no adopta `mensajes[]` ni el contrato completo; hay que mapear conceptos.

**Opción C — Híbrida (contrato v2 detrás de un adaptador).** Definir el contrato
nuevo como v2 con un adaptador que lo traduce al actual; migrar el banco gradual.
- Pro: permite escribir contenido en el formato nuevo sin bloquear la UI.
- Contra: capa de traducción temporal que hay que recordar eliminar.

## 7. Preguntas abiertas para la reunión

**Arquitectura (Francis)**
1. La frase "el system prompt viaja desde el cliente": ¿simplificación de
   redacción o cambio deliberado? Si es deliberado, ¿cómo se sostiene la garantía
   de "filtro servidor independiente" de `seguridad-infantil.md`?
2. `revisarMensajeDelNino()`: ¿va en `guardrails.ts` junto al filtro de salida, o
   en el store antes de llamar al proveedor?
3. Las "10 reglas inquebrantables": ¿reemplazan las 7 actuales o suman 3 nuevas?
4. El bonus de resistir (150 pts): ¿lo calcula el motor puro (recibiendo un
   resultado de chat como parámetro) o el store? Hoy el LLM está deliberadamente
   desacoplado del puntaje.

**Front (Jerick)**
5. `mensajes: [{de,texto}]`: ¿se necesita una mini-secuencia de burbujas antes de
   la decisión trampa/confianza, o casi siempre será 1 elemento? Cambia el layout.
6. ¿Cómo se ven los canales nuevos (`plataforma_colegio`, `notificacion_juego`)?
   El tratamiento visual por canal sigue pendiente incluso para los 5 actuales.
7. El tiempo de respuesta para el bonus de velocidad: ¿se mide en la UI con
   `performance.now()` y se pasa a `responder()`, o vive en el store?

**Contenido (Clau)**
8. Los escenarios ya escritos, ¿se migran al contrato nuevo o se reescriben desde
   cero con `feedbackAcierto/feedbackError` y `mensajes[]`?

## 8. Siguientes pasos

1. Reunión de validación con Front y Arquitectura usando este documento.
2. Decidir la opción de alcance (§6).
3. Resolver explícitamente el conflicto §5.1 — el único marcado como no negociable
   sin acuerdo del equipo completo.
4. Con el alcance decidido, generar `requirements.md` / `design.md` / `tasks.md`
   (probablemente una spec nueva `contrato-escenarios-v2`, o updates a las 3 specs
   existentes).
5. Recién entonces pasar a implementación.

## 9. Avance de Jerick: la spec `interfaz-telefono` (ya en `main`)

Después de escribir §1–§8, Jerick mergeó a `main` la spec `interfaz-telefono`,
que reconstruyó toda la capa de presentación. Esto cambia el cálculo de riesgo
de la §6.

### 9.1 Qué construyó (verificado en el repo)

- **iPhone simulado completo**: animación de encendido, pantalla de bloqueo,
  parte trasera al girar, home con grid de apps y status bar. Todo sobre una
  máquina de estados pura (`src/components/telefono/maquina.ts`, reducer sin React).
- **5 apps mapeadas a los 5 canales del contrato**: WhatsApp, Mensajes (`sms`),
  Discord, Gmail (`correo`) y Roblox (`chat-juego`). El mapeo
  `appPorCanal()` (`src/components/telefono/apps.ts`) es **total por
  construcción**: hay un test de exhaustividad que falla en compilación si el
  contrato agrega un canal sin app registrada.
- **La partida ocurre dentro de la app**: el escenario llega como notificación en
  el lock/home, el niño la abre, decide, ve el feedback con señales resaltadas y,
  si el escenario lo permite, chatea con el estafador — sin salir de la app.
- **WhatsApp como ejemplo completo** (`src/components/apps/whatsapp/`): lista de
  chats con contactos mock (familia y amigos, avatares locales, sin llamadas
  externas) y la conversación del escenario donde vive el loop. El HUD (ronda,
  puntaje, racha) queda visible.

### 9.2 Cómo consume el contrato (clave para el plan)

- La conversación pinta `escenario.mensaje` como **una sola burbuja entrante**
  (`BurbujaWa texto={escenario.mensaje}`). Las burbujas múltiples solo aparecen en
  la fase `chat`, con los turnos del LLM. **No** hay hoy una mini-conversación
  previa a la decisión.
- Usa los **5 canales en kebab-case** existentes, con mapeo total + test de
  exhaustividad.
- Su **Requisito 10** es explícito: la reconstrucción **no** modifica `src/game/`,
  el store, el LLM ni los tipos; los componentes reciben datos por props desde
  `App.tsx`. La única extensión de contrato permitida fue **aditiva**: campos
  opcionales de dirección y asunto para el canal `correo`, coordinados con Clau.

### 9.3 Consecuencia para la §6

La **Opción A (reemplazo completo)** deja de ser solo "arriesgada": ahora sería
**destructiva**, porque rompería WhatsApp, las notificaciones y las 5 apps recién
probadas y en verde. En la práctica, el Requisito 10 de `interfaz-telefono` ya es
un voto del equipo por la vía aditiva. **Este RFC adopta la Opción B.**

## 10. Plan de enriquecimiento aditivo (dirección elegida)

**Principio rector:** todo campo o función nueva es **opcional y con fallback** a
lo actual. Un escenario que no use lo nuevo se ve y se comporta igual que hoy, y
los tests existentes de motor y guardrails siguen en verde. Es la misma regla que
ya aplicó Jerick al extender `correo`.

**Resolución del conflicto §5.1:** este plan **no** adopta "el system prompt viaja
desde el cliente". La Lambda **sigue** reconstruyendo su propio system prompt de
forma independiente (`infra/lambda/estafador/index.mjs`). La doble capa de
contención de `seguridad-infantil.md` se mantiene intacta.

### 10.1 Fase 1 — no toca la UI de Jerick

| Enriquecimiento | Dónde | Por qué no rompe |
|---|---|---|
| `revisarMensajeDelNino()` — filtro de **entrada** del niño antes de enviar al modelo (contraseña, teléfono, dirección, colegio, código) | `src/llm/guardrails.ts` + llamada en el store antes de `obtenerProveedor()` | Solo agrega un chequeo; cierra un hueco real (hoy la entrada del niño no se filtra) |
| **Bonus de velocidad, sumado** (no multiplicador) | `responder(estado, escenario, veredicto, ms?)` con `ms` **opcional** | Si `ms` no llega, el puntaje es idéntico al actual: los tests del motor no cambian |
| **Bonus por resistir al estafador** (+150) | Store marca "resistió" (el niño corta / dice que no) + término nuevo en el resultado | El chat de Jerick ya tiene "Cortar la conversación" y `chatAgotado`; solo falta capturar el desenlace |
| Insignia **"Modo desconfiado"** (legítimos marcados como trampa) | Contador derivado de `resultados` en el resultado final | No cambia el cálculo de nivel actual; es una insignia extra |
| `titulo?` opcional en `SenalDelatora` | `src/types/escenario.ts` + schema | Campo opcional; el resaltado actual funciona sin él |
| `feedbackAcierto?` / `feedbackError?` opcionales por escenario | `src/types/escenario.ts` + schema | Con fallback al texto por tono actual si el escenario no los define |

### 10.2 Fase 2 — aditiva pero coordinada con Jerick

| Enriquecimiento | Reencuadre aditivo | Coordinación |
|---|---|---|
| Mini-conversación antes de decidir | `mensajesPrevios?: string[]` **opcional**, pintado como burbujas **arriba** del mensaje principal; `mensaje` se mantiene | Toca `ConversacionWa` / `BurbujaWa`: lo implementa Jerick |
| Canales nuevos | Solo los que tengan **app real** detrás, en **kebab-case** (no snake_case, para no romper el test de exhaustividad) | Cada canal nuevo = una app nueva que construye Jerick |

### 10.3 Lo que este plan descarta de la propuesta original

- Renombrar `tipo` → `categoria` y agregar `esEstafa` (redundante; se conserva
  `tipo` + `respuestaCorrecta`).
- Reemplazar la fórmula de puntaje por la multiplicativa (se suma velocidad, no se
  multiplica).
- `maxTurnos` por escenario (se mantiene la constante global `MAX_TURNOS_CHAT`).
- Los 8 canales en snake_case y "el system prompt viaja desde el cliente".

### 10.4 Siguiente paso concreto

Con la Fase 1 aprobada, generar una spec nueva (sugerido: `enriquecimiento-aditivo`)
con `requirements.md` en formato EARS, marcando cada requisito como aditivo y con
su criterio de "no rompe lo existente" (tests de motor y guardrails en verde,
UI de Jerick sin cambios en Fase 1).
