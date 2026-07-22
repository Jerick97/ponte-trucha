# Ponte Trucha Kids — Estándares y Convenciones de Código

> Steering global. Kiro aplica estas reglas en cada edición sin que haga falta repetirlas.

## Idioma

- **Código de dominio en español**: `escenario`, `veredicto`, `racha`, `nivelTrucha`.
  El dominio es peruano y el equipo habla español; traducirlo introduce ambigüedad.
- **APIs de plataforma en inglés**, tal cual existen: `fetch`, `useState`, `onClick`.
- **Comentarios y documentación en español**, sin tildes en identificadores.
- **Commits en español**, en imperativo: `agrega validador del banco de escenarios`.

## TypeScript

- `strict: true`. Prohibido `any`; si algo es desconocido, `unknown` y se acota.
- Tipado explícito en parámetros y valores de retorno de funciones exportadas.
- `interface` para formas de objeto, `type` para uniones y alias primitivos.
- `const` por defecto; `let` solo cuando hay reasignación real.
- Nombres: `PascalCase` para tipos y componentes, `camelCase` para funciones y
  variables, `UPPER_SNAKE_CASE` para constantes exportadas.
- Los tipos compartidos entre áreas viven en `src/types/`. Si dos carpetas
  necesitan el mismo tipo, sube a `src/types/`, no lo dupliques.

## React

- Solo componentes funcionales con hooks.
- Un componente = una responsabilidad visual. Si un archivo pasa de ~150 líneas,
  se parte.
- Los componentes de `src/components/` **no** importan de `src/llm/` ni contienen
  reglas de juego: reciben props y emiten callbacks.
- Props tipadas con una `interface Props` local, nunca inline.
- El estado global se lee con selectores puntuales
  (`usePartida((s) => s.puntaje)`), nunca el store entero.

## Estilos

- Tailwind CSS 4 con tokens declarados en `@theme` dentro de `src/index.css`.
- **Prohibido el color crudo** (`#hex`, `bg-red-500`) en componentes. Todo color
  sale de un token: `bg-[var(--color-trampa)]`.
- Área táctil mínima 44×44 px; los botones principales van a `min-h-14`.
- El layout se piensa **mobile-first**: el juego se ve en el celular de un niño.

## Lógica de juego

- `src/game/` es **puro**: sin React, sin `window`, sin `fetch`, sin `Date.now()`
  ni `Math.random()` no inyectados. Toda aleatoriedad entra como parámetro
  (`aleatorio: () => number`) para que los tests sean deterministas.
- El store (`src/store/`) solo orquesta: llama al motor y guarda el resultado.
  Si aparece una fórmula de puntaje en el store, está en el archivo equivocado.

## Contenido

- El banco de escenarios (`src/data/escenarios.json`) solo se edita junto con
  `npm run validar:escenarios` en verde. El hook de Kiro lo corre solo.
- Cada `fragmento` de una señal debe existir **literal** dentro del mensaje,
  o la UI no puede resaltarlo.

## Pruebas

- Obligatorias para `src/game/` y `src/llm/guardrails.ts`: son las dos piezas
  donde un bug cambia lo que un niño aprende.
- Nombres de test en español, describiendo comportamiento:
  `it('reinicia la racha al fallar')`.

## Prohibiciones duras

- Ninguna API key en `src/`. Las variables `VITE_*` son públicas por definición:
  ahí solo va la URL del endpoint, nunca un secreto.
- Cero recolección de datos del niño: sin analítica, sin cookies de terceros,
  sin login, sin campos de nombre o correo.
- Nada de dependencias nuevas sin acuerdo del equipo: cada paquete es peso en el
  bundle y riesgo en la demo.
