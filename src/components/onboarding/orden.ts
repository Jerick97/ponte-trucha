/**
 * Helper del reveal escalonado: `.ad-revela` lee `--i` para calcular su
 * `animation-delay`. Se centraliza para no repetir el cast en cada componente.
 */

import type { CSSProperties } from 'react';

/** Posicion en la secuencia de entrada (0 = primero). */
export function orden(i: number): CSSProperties {
  return { '--i': i } as CSSProperties;
}
