# Design Document: Loop de juego y teléfono simulado

> Diseño actual del demo. La fuente remota de retos/progreso y los estados de
> red se agregarán únicamente al ejecutar la tarea de integración de
> `../backend-serverless/tasks.md`.

## Overview

Máquina de fases sencilla montada sobre un store de zustand. La lógica de
puntaje vive en funciones puras (`src/game/motor.ts`) para poder testearla sin
DOM; los componentes solo pintan. `App.tsx` es un `switch` sobre la fase actual.

Cero dependencias de UI externas: el "teléfono" es CSS. Eso mantiene el bundle
por debajo del presupuesto y evita sorpresas en la demo.

## Architecture

```
App.tsx  (máquina de fases)
   │
   ├── fase 'inicio'     → PantallaInicio
   ├── fase 'mensaje'    → MarcoTelefono + Hud + Burbuja + BarraDecision
   ├── fase 'feedback'   → MarcoTelefono + Burbuja(resaltada) + TarjetaFeedback
   ├── fase 'chat'       → MarcoTelefono + ChatEstafador      (otra spec)
   └── fase 'resultado'  → PantallaResultado
                                │
                     usePartida (zustand)
                                │
                     ┌──────────┴──────────┐
                     ▼                     ▼
              game/motor.ts        game/nivelTrucha.ts
              (puro, testeable)     (puro, testeable)
```

Transiciones válidas:

```
inicio ──iniciar()──> mensaje ──responderEscenario()──> feedback
                        ▲                                 │
                        │                    abrirChat() ──┤
                        │                                 ▼
                        └────── siguiente() ────────── chat
                                                          │
                     (último escenario) ──> resultado ──reiniciar()──> inicio
```

## Components and Interfaces

### `src/game/motor.ts` — lógica pura

```typescript
export const RONDAS_POR_PARTIDA = 8;
export const PUNTOS_ACIERTO = 100;
export const BONUS_POR_RACHA = 25;
export const MAX_BONUS_RACHA = 100;

export interface EstadoPartida {
  puntaje: number;
  racha: number;
  mejorRacha: number;
  aciertos: number;
  fallos: number;
  resultados: ResultadoRonda[];
}

crearPartida(): EstadoPartida
barajar<T>(items, aleatorio?): T[]                    // aleatoriedad inyectable
armarRonda(banco, totalRondas?, aleatorio?): Escenario[]
calcularPuntos(rachaPrevia: number): number
responder(estado, escenario, respuesta): EstadoPartida // inmutable
```

Decisión: `responder` devuelve un estado nuevo en vez de mutar. Hace los tests
triviales y evita bugs de render en React.

### `src/game/nivelTrucha.ts`

```typescript
export interface NivelTrucha {
  clave: 'novato' | 'despierto' | 'trucha' | 'super-trucha';
  titulo: string; emoji: string; frase: string; color: string;
}
porcentajeAciertos(estado): number
calcularNivel(estado): NivelTrucha
```

Los cortes (90/70/45) son decisión de producto de Clau, no técnica: se ajustan
tras el primer playtest con niños reales.

### `src/store/usePartida.ts`

Único punto donde se combinan motor, banco y LLM. Expone acciones, no estado
mutable. Los componentes leen con selectores puntuales para evitar re-renders.

### Componentes (`src/components/`)

| Componente | Responsabilidad | No hace |
|---|---|---|
| `MarcoTelefono` | Carcasa, barra superior, zona de pie | No conoce fases |
| `Burbuja` | Texto + resaltado de señales | No decide cuándo resaltar |
| `BarraDecision` | Los dos botones | No calcula puntaje |
| `TarjetaFeedback` | Explicación y lección | No sabe de rondas |
| `Hud` | Ronda, puntaje, racha | Solo lee props |
| `PantallaInicio` / `PantallaResultado` | Portada y cierre | — |

### Algoritmo de resaltado

`Burbuja` recibe las señales y parte el texto buscando cada `fragmento` de forma
literal, en orden de aparición. Si un fragmento no aparece en el mensaje, se
ignora en runtime — y el validador del banco lo marca como error en tiempo de
build, que es donde debe fallar.

## Data Models

Ver `src/types/escenario.ts`. Es el contrato compartido entre las tres áreas;
cualquier cambio ahí obliga a actualizar `escenarios.schema.json` y el validador.

## Error Handling

| Situación | Comportamiento |
|---|---|
| Banco con menos de 8 escenarios | `armarRonda` devuelve los que haya; la partida es más corta |
| Escenario sin señales | Imposible: el validador falla antes del build |
| `escenarioActual()` nulo | `App` retorna `null` en vez de romper |
| Web Share API ausente | Fallback a portapapeles; si tampoco existe, no hace nada visible |

## Testing Strategy

- **Unitarias (obligatorias)**: `motor.ts` y `nivelTrucha.ts` con `vitest`.
  Aleatoriedad inyectada para que los tests sean deterministas.
- **Casos borde cubiertos**: racha topeada, fallo tras racha larga, mensaje
  legítimo respondido como confianza, ronda sin repetidos, orden por dificultad.
- **Manual antes de la demo**: partida completa en Chrome Android y en iPhone
  Safari, y una partida entera solo con teclado.
