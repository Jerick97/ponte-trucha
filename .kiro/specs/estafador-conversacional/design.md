# Design Document: Estafador conversacional

## Overview

Tres proveedores intercambiables detrás de una sola interfaz. El selector prueba
en orden y se queda con el primero disponible; la UI nunca sabe cuál ganó. Toda
salida —venga de donde venga— pasa por el mismo filtro de guardrails.

Regla de diseño: **el proveedor nunca lanza excepciones**. Siempre resuelve con
una respuesta mostrable. Un error de red no puede romper la demo.

## Architecture

```
store.enviarMensajeAlEstafador(texto)
        │
        ▼
   obtenerProveedor()          ← se decide UNA vez por sesión
        │
        ├─ ProveedorPromptApi   ¿globalThis.LanguageModel?     plan A
        ├─ ProveedorLambda      ¿VITE_LLM_ENDPOINT?            plan B
        └─ ProveedorGuionLocal  siempre disponible             último recurso
        │
        ▼
   proveedor.responder({ escenario, historial })
        │
        ├── construirSystemPrompt() + construirUserPrompt()
        ├── llamada al modelo (local o remota)
        └── filtrarRespuesta()   ← guardrails, SIEMPRE
        │
        ▼
   { texto, origen, filtrada }
```

En el plan B hay una segunda barrera independiente: la Lambda arma su propio
system prompt con las mismas reglas. Si el cliente fuera manipulado, el servidor
sigue acotado.

## Components and Interfaces

### `src/llm/tipos.ts` — el contrato

```typescript
type OrigenRespuesta = 'on-device' | 'lambda' | 'guion-local';

interface TurnoChat { autor: 'nino' | 'estafador'; texto: string; }

interface RespuestaEstafador {
  texto: string;
  origen: OrigenRespuesta;
  filtrada: boolean;      // true si el guardrail intervino
}

interface ProveedorLlm {
  readonly nombre: OrigenRespuesta;
  estaDisponible(): Promise<boolean>;
  responder(contexto: ContextoConversacion): Promise<RespuestaEstafador>;
}
```

### `src/llm/promptApi.ts` — plan A

Usa `globalThis.LanguageModel`. La API es experimental y cambia entre versiones
de Chrome, por eso su forma se declara localmente y **todo** el contacto con ella
está en este archivo: si Chrome la renombra, se toca un solo lugar.

- `availability()` debe devolver `'available'`. Los estados `'downloadable'` y
  `'downloading'` cuentan como no disponible: no se le hace esperar al niño una
  descarga de modelo durante la demo.
- La sesión se crea con `initialPrompts: [{ role: 'system', ... }]` y se reutiliza
  dentro del mismo escenario para conservar el contexto.
- `cerrar()` destruye la sesión al cambiar de escenario.

### `src/llm/lambdaClient.ts` — plan B

`fetch` POST con `AbortSignal.timeout(4000)`. Envía solo lo mínimo. Cualquier
fallo (HTTP, timeout, JSON inválido) degrada al guion local sin propagar el error.

### `src/llm/prompts.ts` — el personaje

System prompt con siete reglas duras (ver `.kiro/steering/seguridad-infantil.md`).
El perfil viene del escenario: `disfraz`, `tacticas`, `objetivo`. El user prompt
lleva el mensaje original y el historial formateado.

### `src/llm/guardrails.ts` — el filtro

```typescript
filtrarRespuesta(textoCrudo: string, indice?: number): { texto, filtrada }
recortarPalabras(texto: string, maximo?: number): string
```

Pasos: quitar comillas y prefijos de rol → normalizar (minúsculas, sin tildes) →
buscar términos prohibidos → si hay coincidencia o el texto está vacío, devolver
una frase del guion seguro → si no, recortar a 30 palabras.

El `indice` (largo del historial) elige la frase de reemplazo sin usar
`Math.random()`: así los tests son deterministas.

### Lambda (`infra/lambda/estafador/index.mjs`)

Runtime `nodejs22.x`, Function URL con CORS restringido al dominio de CloudFront.
`MISTRAL_API_KEY` como variable de entorno de la función — nunca en el frontend.
Historial recortado a los últimos 8 turnos. En caso de error devuelve
`{ texto: '' }` con status 200: el cliente ya sabe qué hacer con un texto vacío.

## Data Models

El proveedor recibe `ContextoConversacion { escenario, historial }`. No conoce
puntaje, fases ni rondas: el LLM no debe poder influir en la puntuación.

## Error Handling

| Situación | Comportamiento | Visible para el niño |
|---|---|---|
| Prompt API ausente | Se elige Lambda | No |
| Modelo descargándose | Se trata como ausente | No |
| Lambda con 500 | Guion local | No |
| Timeout de 4 s | Guion local | No |
| Respuesta con término prohibido | Guion seguro, `filtrada: true` | No |
| Respuesta vacía | Guion seguro | No |

## Testing Strategy

- **Obligatorio**: `src/test/guardrails.test.ts`. Cubre términos prohibidos con y
  sin tildes, texto vacío, prefijos de rol, recorte y paso libre de presión normal.
- **Manual**: probar en Chrome con la Prompt API activada (`chrome://flags`) y en
  Firefox/Safari para verificar que el fallback entra sin que se note.
- **De la Lambda**: `curl` con un payload de ejemplo y verificar que los logs no
  contienen el texto del chat.

## Notas de despliegue

La Prompt API requiere Chrome reciente y puede necesitar un flag. Para el video
se graba en un Chrome con la API activa; se muestra el fallback como parte de la
narrativa técnica, no como un problema.
