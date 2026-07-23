/**
 * Gesto de giro del telefono: arrastre horizontal con el cursor (o dedo).
 * Mientras se arrastra, la carcasa sigue al puntero; al soltar, si el
 * arrastre fue suficiente se confirma el giro (evento GIRAR), si no,
 * la carcasa vuelve a su cara actual.
 */

import { useRef, useState } from 'react';
import type { PointerEvent, MouseEvent } from 'react';

/** Px de arrastre horizontal para empezar a girar (evita robar clicks). */
const UMBRAL_INICIO = 25;
/** Grados de giro acumulados que confirman el volteo al soltar. */
const UMBRAL_CONFIRMA = 70;
/** Cuantos grados gira el telefono por px arrastrado. */
const GRADOS_POR_PX = 0.45;

interface GiroArrastre {
  /** Grados extra que el arrastre agrega a la cara actual. */
  deltaGrados: number;
  /** true mientras el puntero esta girando (desactiva la transicion CSS). */
  arrastrando: boolean;
  alPresionar: (evento: PointerEvent<HTMLDivElement>) => void;
  alMover: (evento: PointerEvent<HTMLDivElement>) => void;
  alSoltar: (evento: PointerEvent<HTMLDivElement>) => void;
  /** Suprime el click fantasma que queda despues de un arrastre. */
  alCapturarClick: (evento: MouseEvent<HTMLDivElement>) => void;
}

export function useGiroArrastre(habilitado: boolean, onGirar: () => void): GiroArrastre {
  const inicio = useRef<{ x: number; y: number } | null>(null);
  const girando = useRef(false);
  const huboArrastre = useRef(false);
  const [deltaGrados, setDeltaGrados] = useState(0);

  function alPresionar(evento: PointerEvent<HTMLDivElement>) {
    if (!habilitado) return;
    inicio.current = { x: evento.clientX, y: evento.clientY };
  }

  function alMover(evento: PointerEvent<HTMLDivElement>) {
    if (!inicio.current) return;
    const dx = evento.clientX - inicio.current.x;
    const dy = evento.clientY - inicio.current.y;

    if (!girando.current) {
      // Solo se vuelve giro si el gesto es claramente horizontal.
      if (Math.abs(dx) < UMBRAL_INICIO || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      girando.current = true;
      evento.currentTarget.setPointerCapture(evento.pointerId);
    }
    setDeltaGrados(dx * GRADOS_POR_PX);
  }

  function alSoltar(evento: PointerEvent<HTMLDivElement>) {
    if (girando.current) {
      if (Math.abs(deltaGrados) >= UMBRAL_CONFIRMA) onGirar();
      girando.current = false;
      huboArrastre.current = true;
      evento.currentTarget.releasePointerCapture?.(evento.pointerId);
    }
    inicio.current = null;
    setDeltaGrados(0);
  }

  function alCapturarClick(evento: MouseEvent<HTMLDivElement>) {
    if (!huboArrastre.current) return;
    huboArrastre.current = false;
    evento.preventDefault();
    evento.stopPropagation();
  }

  return { deltaGrados, arrastrando: girando.current, alPresionar, alMover, alSoltar, alCapturarClick };
}
