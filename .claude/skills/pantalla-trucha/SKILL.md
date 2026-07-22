---
name: pantalla-trucha
description: Construye o modifica pantallas y componentes de UI de Ponte Trucha Kids (teléfono simulado, burbujas, feedback, resultado). Úsala cuando se pida crear un componente, cambiar el diseño, ajustar estilos, agregar una pantalla o mejorar la accesibilidad del juego. Impone los design tokens, el mobile-first y las reglas de capas del proyecto.
license: MIT
---

# Pantalla Trucha

Owner de la UI: **Jerick**.

## Antes de escribir

1. Carga la skill global **`frontend-design`** para el criterio visual, y
   **`accessibility`** si el trabajo toca foco, contraste o navegación.
2. Lee `.kiro/steering/estandares-de-codigo.md` (sección React y Estilos).
3. Lee `.kiro/steering/arquitectura.md` para no romper las reglas de capas.
4. Mira `src/index.css` para saber qué tokens existen antes de inventar uno.

## Reglas de capa (no negociables)

- Un componente de `src/components/` **no** importa `src/llm/`, no llama `fetch`
  y no calcula puntaje. Recibe props, emite callbacks.
- Si un componente necesita un dato del juego, lo pide por props; quien lo
  conecta al store es `App.tsx`.
- El estado global se lee con selectores puntuales:
  `usePartida((s) => s.puntaje)`, nunca el store completo.

## Reglas de estilo

- **Cero color crudo.** Nada de `#hex` ni `bg-red-500`. Todo sale de un token:
  `bg-[var(--color-trampa)]`. Si falta un token, se agrega a `@theme` en
  `src/index.css` con nombre semántico (`--color-<rol>`), no descriptivo
  (`--color-rojo`).
- Mobile-first. El marco del juego no pasa de 420 px; se prueba a 360 px de ancho.
- Área táctil mínima 44×44 px. Botones principales: `min-h-14`.
- Toda animación respeta `prefers-reduced-motion` (ya hay una regla global en
  `index.css`; no la anules con `!important`).

## Accesibilidad mínima de cada pantalla

- Contraste 4.5:1 en texto normal, 3:1 en texto grande.
- El feedback se anuncia con `aria-live="polite"`.
- Todo control es alcanzable con `Tab` y tiene foco visible.
- Los emojis decorativos llevan `aria-hidden`; los informativos, texto alterno.
- Los `<input>` tienen `<label>`, aunque sea con `sr-only`.

## Estructura de un componente

```tsx
/** Una línea explicando qué pinta y qué NO hace. */

interface Props {
  // tipado explícito, nunca inline
}

export function NombreComponente({ ... }: Props) {
  return ( ... );
}
```

Archivo de más de ~150 líneas: se parte.

## Cierre obligatorio

```bash
npm run lint && npm run build
```

Si el cambio es visual, describe qué debería verse distinto para que Jerick lo
verifique en el navegador. No afirmes que "se ve bien" sin haberlo abierto.
