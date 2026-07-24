/**
 * Confeti de celebracion: se muestra al acertar. Es adorno visual puro,
 * sin logica de juego. Se oculta solo con prefers-reduced-motion (via CSS).
 * La cantidad de piezas sube con la racha para celebrar mas fuerte.
 *
 * Nota de capas: vive en components/ y no importa nada del juego; recibe
 * cuantas piezas mostrar por props.
 */

import { useMemo, type CSSProperties } from 'react';

/** Colores de las piezas, todos desde tokens (nada de color crudo). */
const COLORES = [
  'var(--color-marca-500)',
  'var(--color-confianza)',
  'var(--color-nivel-despierto)',
  'var(--color-nivel-super)',
  'var(--color-nivel-trucha)',
] as const;

interface Props {
  /** Cuantas piezas caen. Sube con la racha. */
  piezas?: number;
}

export function Confetti({ piezas = 24 }: Props) {
  const trozos = useMemo(
    () =>
      Array.from({ length: piezas }, (_, i) => ({
        izquierda: Math.random() * 100,
        retraso: Math.random() * 0.25,
        duracion: 1.1 + Math.random() * 0.9,
        color: COLORES[i % COLORES.length],
        giro: Math.round(Math.random() * 360),
        ancho: 5 + Math.round(Math.random() * 6),
        alto: 8 + Math.round(Math.random() * 8),
      })),
    [piezas],
  );

  return (
    <div className="confeti" aria-hidden="true">
      {trozos.map((t, i) => (
        <span
          key={i}
          className="confeti-pieza"
          style={
            {
              left: `${t.izquierda}%`,
              width: `${t.ancho}px`,
              height: `${t.alto}px`,
              backgroundColor: t.color,
              animationDelay: `${t.retraso}s`,
              animationDuration: `${t.duracion}s`,
              '--giro': `${t.giro}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
