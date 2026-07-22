# Design Document: Banco de escenarios

## Overview

Contenido estático versionado en git, validado en dos niveles: un JSON Schema
para la forma y un script de Node para las reglas que un schema no puede
expresar (coherencia tipo↔respuesta, fragmentos literales, proporción de
legítimos). Un hook de Kiro dispara el validador en cada edición.

Sin base de datos, sin CMS, sin llamada a la nube: el banco viaja dentro del
bundle. Cambiar contenido es un commit.

## Architecture

```
Clau escribe/pide a Kiro un escenario
            │
            ▼
   src/data/escenarios.json
            │
    ┌───────┴────────┐
    │ hook de Kiro   │  .kiro/hooks/validar-escenarios.kiro.hook
    │ (fileEdited)   │
    └───────┬────────┘
            ▼
  npm run validar:escenarios
            │
   ┌────────┴─────────┐
   │ escenarios.schema.json (forma)      │
   │ validar-escenarios.mjs (reglas)     │
   └────────┬─────────┘
            │  falla → error con id y motivo, no se avanza
            ▼
   import banco from '../data/escenarios.json'
            │
      armarRonda() → el juego
```

## Data Models

```typescript
interface Escenario {
  id: string;                    // kebab-case, único
  tipo: TipoEscenario;           // familia de estafa o 'legitimo'
  canal: CanalMensaje;           // define el skin del teléfono
  dificultad: 1 | 2 | 3;         // ordena la partida
  remitente: { nombre, avatar, verificado };
  mensaje: string;               // ≤ 240 caracteres
  respuestaCorrecta: Veredicto;  // derivada del tipo
  senales: SenalDelatora[];      // 1 a 3, con fragmento literal
  leccion: string;               // una frase, ≤ 18 palabras
  permiteConversacion: boolean;  // habilita el LLM
  perfilEstafador?: { disfraz, tacticas, objetivo };
}
```

Decisión: `respuestaCorrecta` es redundante con `tipo`, pero se guarda explícita
para que la UI no tenga que derivarla y para que el validador pueda atrapar la
incoherencia. La redundancia controlada por un validador es más barata que un
bug silencioso en la demo.

## Guía de escritura por familia

| Tipo | Gancho típico | Señal que enseñamos | Mínimo en el banco |
|---|---|---|---|
| `monedas-gratis` | "Robux/pavos gratis" | Nadie regala; te piden la clave | 3 |
| `sorteo-falso` | "Ganaste, paga el envío" | Cobrar por un premio gratis | 3 |
| `robo-de-cuenta` | "Soy admin, verifico tu cuenta" | Un admin nunca pide tu clave | 3 |
| `hack-con-virus` | "Baja este archivo, vidas infinitas" | Archivos fuera de la tienda oficial | 2 |
| `link-tramposo` | `robl0x-premios.com` | Letras cambiadas en la dirección | 2 |
| `suplantacion-de-amigo` | "Perdí mi cel, pásame el código" | Los códigos no se comparten | 2 |
| `legitimo` | Código real, invitación de un amigo | No te pide nada tuyo | 6 a 8 |

## Validación en dos capas

**Capa 1 — `escenarios.schema.json`**: tipos, enums, requeridos, longitudes,
`additionalProperties: false`.

**Capa 2 — `scripts/validar-escenarios.mjs`** (lo que un schema no ve):

1. `id` único y kebab-case.
2. Coherencia `tipo` ↔ `respuestaCorrecta`.
3. Cada `fragmento` existe literal en `mensaje`.
4. `permiteConversacion` implica `perfilEstafador`.
5. Un `legitimo` no puede permitir conversación.
6. Proporción de legítimos ≥ 25 % (aviso).
7. Lección ≤ 18 palabras (aviso).

Los **errores** cortan con `exit 1`; los **avisos** solo se imprimen. La
distinción importa: un aviso no debe frenar a Clau a las 11 de la noche.

## Prompt de referencia para generar con Kiro

Al pedirle a Kiro un escenario nuevo, el prompt debe incluir siempre:

```
Genera un escenario para el banco de Ponte Trucha Kids.
Aplica .kiro/steering/tono-infantil.md y .kiro/steering/seguridad-infantil.md.
Tipo: <tipo>. Canal: <canal>. Dificultad: <1-3>.
Requisitos duros:
- El mensaje suena a un chat real de Roblox/Free Fire, en español latino, ≤ 240 caracteres.
- Cada fragmento de señal debe aparecer literal en el mensaje.
- La lección va en una frase de máximo 18 palabras, sin jerga técnica.
- Si permiteConversacion es true, incluye perfilEstafador sin temas prohibidos.
Devuelve solo el objeto JSON, sin explicación.
```

## Error Handling

| Situación | Resultado |
|---|---|
| Fragmento que no aparece en el mensaje | Error, con id y fragmento exacto |
| Legítimo marcado como `trampa` | Error de coherencia |
| Campo desconocido (typo en el nombre) | Error, evita datos que nadie lee |
| Banco con pocos legítimos | Aviso, no bloquea |

## Testing Strategy

- El propio validador es la prueba del contenido; corre en el hook y en CI.
- `src/test/motor.test.ts` usa el banco real: si el contenido rompe una regla del
  juego (por ejemplo, quedarse sin legítimos), los tests del motor lo detectan.
- Playtest con un niño real antes del sábado. Es la única prueba que mide si el
  tono funciona; ningún script lo puede validar.
