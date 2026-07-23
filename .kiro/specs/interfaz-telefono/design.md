# Design Document: Interfaz del teléfono simulado

> La integración remota no debe implementarse desde este documento. Usar
> `../backend-serverless/` para el contrato y
> `../autenticacion-consentimiento-parental/` para onboarding/sesión.

## Overview

Dos máquinas de estado independientes que se sincronizan en `App.tsx`:

1. **La partida** (`usePartida`, ya existe, no se toca): fases
   `inicio → mensaje → feedback → chat → resultado`.
2. **El teléfono** (nueva, reducer puro): estado físico del dispositivo
   (apagado, encendiendo, bloqueado, girado, app abierta).

La partida decide **qué contenido** se muestra; el teléfono decide **en qué
contenedor**. Ninguna de las dos conoce a la otra: `App.tsx` es el único punto
de sincronización.

Referencia visual: CodePen "CSS Interactive iPhone 12 iOS 14" de Jorge Aguilar.
Se reimplementa el comportamiento (encendido, giro, bloqueo) en React +
Tailwind con tokens; **no** se porta su código (jQuery/SCSS), no se cargan
audios ni imágenes externas, y todo el "hardware" del teléfono es CSS puro
para respetar el presupuesto de bundle.

## Architecture

### Máquina de estados del teléfono

Reducer puro en `src/components/telefono/maquina.ts` (sin React, sin DOM:
testeable con Vitest en node). `App.tsx` lo consume con `useReducer`.

```typescript
export type Energia = 'apagado' | 'encendiendo' | 'encendido';

export interface EstadoTelefono {
  energia: Energia;
  bloqueado: boolean;      // solo relevante con energia === 'encendido'
  girado: boolean;         // mostrando la parte trasera (ortogonal al resto)
  appAbierta: AppId | null;
}

export type EventoTelefono =
  | { tipo: 'ENCENDER'; saltarAnimacion?: boolean }  // reduced-motion
  | { tipo: 'FIN_ANIMACION' }
  | { tipo: 'DESBLOQUEAR' }
  | { tipo: 'BLOQUEAR' }        // botón lateral
  | { tipo: 'GIRAR' }
  | { tipo: 'ABRIR_APP'; app: AppId }
  | { tipo: 'CERRAR_APP' };

export function transicion(estado: EstadoTelefono, evento: EventoTelefono): EstadoTelefono;
export const ESTADO_INICIAL: EstadoTelefono;
```

Diagrama de energía y bloqueo:

```
apagado ──ENCENDER──> encendiendo ──FIN_ANIMACION──> encendido + bloqueado
   │                                                        │
   └──ENCENDER {saltarAnimacion}────────────────────────────┘
                                                            │
                              DESBLOQUEAR ──> encendido + desbloqueado (home)
                                                            │
                              BLOQUEAR <──── desde cualquier pantalla frontal
                              (conserva appAbierta para restaurar al desbloquear)
```

Invariantes (cada una es un test):

- `DESBLOQUEAR`, `ABRIR_APP`, `GIRAR` se ignoran si `energia !== 'encendido'`.
- `ABRIR_APP` se ignora si `bloqueado` o `girado`.
- `BLOQUEAR` **no** borra `appAbierta`: al desbloquear se vuelve donde se estaba (Req 2.4).
- `GIRAR` no altera `bloqueado` ni `appAbierta` (Req 3.3).
- Eventos desconocidos o redundantes devuelven el mismo estado (identidad referencial).

La animación de encendido es CSS dirigida por clases derivadas de `energia`;
los timers que disparan `FIN_ANIMACION` viven en un `useEffect` de `App.tsx`
(el reducer nunca conoce `setTimeout`). Con `prefers-reduced-motion`
(`matchMedia`, leído en `App.tsx`) se despacha `ENCENDER {saltarAnimacion}`.

### Sincronización partida ⇄ teléfono en `App.tsx`

| Evento | Reacción |
|---|---|
| Toque en "Encender" (teléfono apagado) | `ENCENDER` |
| `DESBLOQUEAR` con fase `inicio` | `iniciar()` la partida |
| Fase `mensaje` + home | `HomeScreen` muestra banner + badge del canal del escenario actual |
| Toque en banner o ícono con badge | `ABRIR_APP(appPorCanal(escenario.canal))` |
| `siguiente()` tras feedback o chat | además `CERRAR_APP` → home muestra la siguiente notificación |
| Fase `resultado` | pantalla de resultado a pantalla completa dentro del teléfono |
| `reiniciar()` | el teléfono queda encendido en home; no se repite el boot |

### Árbol de componentes

```
App.tsx (sincroniza; useReducer(maquina) + selectores de usePartida)
└── Iphone                        carcasa, botones físicos, notch, caras
    ├── ParteTrasera              cámaras + logo (visible con girado)
    └── cara frontal
        ├── PantallaApagada       negra, CTA "Encender"
        ├── AnimacionArranque     logo + zoom (clases CSS según energia)
        ├── PantallaBloqueo       hora, fecha, "desliza para desbloquear"
        └── encendido y desbloqueado:
            ├── StatusBar         hora, señal, batería simuladas
            ├── HomeScreen        wallpaper, grid de IconoApp, dock
            │   └── BannerNotificacion   remitente + vista previa
            └── appAbierta:
                ├── AppConversacion      whatsapp | sms | discord | chat-juego
                │   ├── Burbuja          (con resaltado de señales)
                │   ├── BarraDecision    fase mensaje
                │   ├── TarjetaFeedback  fase feedback
                │   └── ChatEstafador    fase chat
                ├── AppGmail             vista de correo (asunto, dirección, cuerpo)
                │   └── BarraDecision / TarjetaFeedback
                └── Hud                  ronda, puntaje, racha (flotante, no tapa)
```

Estructura de archivos (todo dentro de `src/components/`, área de Jerick):

```
src/components/
├── telefono/           # el "hardware" y las pantallas del sistema
│   ├── maquina.ts      # reducer puro (TDD)
│   ├── apps.ts         # registro de apps y mapeo canal→app (TDD)
│   ├── vistaPrevia.ts  # recorte del texto para el banner (TDD)
│   ├── Iphone.tsx, ParteTrasera.tsx, PantallaApagada.tsx,
│   ├── AnimacionArranque.tsx, PantallaBloqueo.tsx, StatusBar.tsx,
│   ├── HomeScreen.tsx, IconoApp.tsx, BannerNotificacion.tsx
├── apps/               # las apps simuladas donde ocurre el juego
│   ├── AppConversacion.tsx, AppGmail.tsx, EncabezadoApp.tsx,
│   ├── Burbuja.tsx, BarraDecision.tsx, TarjetaFeedback.tsx,
│   ├── ChatEstafador.tsx, Hud.tsx
└── PantallaResultado.tsx
```

Los componentes actuales se **reemplazan** (decisión aprobada): `MarcoTelefono`,
`PantallaInicio` y `Hud` desaparecen o se reescriben; `Burbuja`,
`BarraDecision`, `TarjetaFeedback` y `ChatEstafador` se reescriben dentro de
`apps/` conservando sus props actuales donde sea posible (el algoritmo de
resaltado por fragmentos literales se conserva tal cual está descrito en la
spec `loop-de-juego`).

### Registro de apps

```typescript
export type AppId = 'whatsapp' | 'mensajes' | 'discord' | 'gmail' | 'chat-juego';

export interface AppSimulada {
  id: AppId;
  nombre: string;            // "WhatsApp", "Mensajes", "Discord", "Gmail", "MundoBloques"
  canal: CanalMensaje;       // correo → gmail, sms → mensajes, resto 1:1
  claseIcono: string;        // clases de token para pintar el ícono (CSS puro)
}

export function appPorCanal(canal: CanalMensaje): AppSimulada;  // total, nunca undefined
export const APPS: AppSimulada[];                               // orden del grid
```

`appPorCanal` es **total**: el test recorre todos los valores de `CanalMensaje`
y exige una app para cada uno. Así, agregar un canal al contrato sin registrar
su app rompe un test, no la demo.

### Animación de encendido (calco del pen, en CSS propio)

Secuencia con `energia === 'encendiendo'` (duraciones como custom properties
para poder ajustarlas en un solo lugar):

1. **0 – 1 s**: el iPhone entra desde abajo (translateY + opacity) mostrando la
   parte trasera (`rotateY(180deg)`).
2. **1 – 2 s**: gira al frente; pantalla negra con el logo del juego (🐟) que
   aparece con fade.
3. **2 – 2.5 s**: el logo escala (~25×) "revelando" la pantalla; se despacha
   `FIN_ANIMACION` → pantalla de bloqueo.

Con `prefers-reduced-motion` no hay secuencia: se pasa directo a bloqueado.
El logo de arranque es el del juego, no la manzana de Apple (evitamos marca
registrada en un producto que se va a mostrar públicamente).

### Giro y bloqueo

- **Giro**: `girado` aplica `rotateY(180deg)` a la carcasa con
  `transform-style: preserve-3d`; la parte trasera es un plano con
  `backface-visibility`. El control es un botón accesible fuera del teléfono
  ("Girar teléfono"), como en el pen.
- **Bloqueo**: el botón lateral derecho de la carcasa es un `<button>` real
  (con `aria-label="Bloquear teléfono"`). Sin audio: el pen usa un mp3 externo
  y aquí no cargamos recursos de terceros.
- **Desbloqueo**: gesto de arrastre vertical (pointer events) **y** un botón
  "Desbloquear" alcanzable con `Tab` (Req 2.5); ambos despachan `DESBLOQUEAR`.

## Design tokens nuevos (`@theme` en `src/index.css`)

```
--color-app-whatsapp / -fondo     verde marca y fondo de chat
--color-app-mensajes / -fondo     azul iMessage-like
--color-app-discord / -fondo      blurple y fondo oscuro
--color-app-gmail / -fondo        rojo Gmail y fondo claro
--color-app-chat-juego / -fondo   morado del juego ficticio
--color-carcasa, --color-carcasa-borde
--color-pantalla-apagada
--color-lock-texto                (sobre wallpaper, contraste AA)
--color-notificacion-fondo
```

Regla vigente: ningún componente usa color crudo. Los colores "de marca" de
cada app se ajustan hasta cumplir 4.5:1 con su texto (Req 9.4); no hace falta
el hex exacto de cada marca, solo que se reconozca.

## Data Models

Ampliación **opcional y retrocompatible** del contrato (coordinar con Clau):

```typescript
export interface Remitente {
  nombre: string;
  avatar: string;
  verificado: boolean;
  /** Solo canal correo: direccion visible, p. ej. "premios@mundob1oques.com". */
  direccion?: string;
}

export interface Escenario {
  // ...sin cambios...
  /** Solo canal correo: asunto del mensaje. */
  asunto?: string;
}
```

En `escenarios.schema.json` y `scripts/validar-escenarios.mjs`: si
`canal === 'correo'`, `asunto` y `remitente.direccion` son **obligatorios**;
en cualquier otro canal, están prohibidos. La dirección del remitente es en sí
una señal delatora natural (dominios raros), así que puede aparecer como
`fragmento` de señal.

Se agrega al banco al menos un escenario `correo` (owner: Clau; en las tareas
va uno de ejemplo para no bloquear la UI).

## Error Handling

| Situación | Comportamiento |
|---|---|
| Canal sin app registrada | Imposible por diseño: `appPorCanal` es total y está testeado |
| Evento de teléfono inválido (p. ej. `ABRIR_APP` bloqueado) | El reducer lo ignora y devuelve el mismo estado |
| `matchMedia` ausente (test/jsdom) | Se asume movimiento normal; el reducer acepta `saltarAnimacion` explícito |
| Escenario `correo` sin `asunto` | El validador del banco falla en build, nunca en runtime |
| Toque en app sin notificación durante la partida | La app abre en estado vacío/resuelto; la notificación pendiente sigue visible al volver al home (Req 4.4) |
| `escenarioActual()` nulo | `App` cae al home sin banner, como hasta ahora con `null` |

## Testing Strategy

TDD estricto para la lógica pura nueva — el test se escribe **antes** que la
implementación, en este orden:

1. `src/test/maquinaTelefono.test.ts`: todas las transiciones e invariantes
   listadas arriba (encendido normal y con salto, bloqueo que conserva la app,
   giro ortogonal, eventos ignorados).
2. `src/test/apps.test.ts`: `appPorCanal` total sobre `CanalMensaje`, sin apps
   duplicadas, orden estable del grid.
3. `src/test/vistaPrevia.test.ts`: recorte del banner (≤ 80 caracteres, corta
   en límite de palabra, agrega elipsis, no rompe con mensajes cortos).
4. Recién entonces, componentes (verificación visual + lint + build).

Los tests existentes (`motor.test.ts`, `guardrails.test.ts`) deben seguir en
verde sin modificarse: son el seguro del Requisito 10.

Verificación manual antes de dar por cerrada la spec: partida completa con
teclado (encender → desbloquear → abrir notificación → decidir → resultado),
prueba a 360 px de ancho, y `prefers-reduced-motion` activado en DevTools.

## Fuera de alcance de esta spec

Del pen de referencia NO se implementan (no aportan al objetivo educativo):
control center, widgets, cámara funcional, mover/eliminar apps, alerta de
batería baja, buscador. El teléfono es un escenario de juego, no un simulador
completo de iOS.
