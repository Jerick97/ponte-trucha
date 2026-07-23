/**
 * Scroll por arrastre y por rueda, como en un telefono real: arrastrar
 * verticalmente con el cursor (o dedo) desplaza el contenedor y la rueda
 * del mouse tambien (el scroll nativo se pierde dentro del contexto 3D de
 * la carcasa, asi que se aplica a mano). Convive con el giro (que solo
 * reacciona a arrastres horizontales) y no roba clicks.
 */

import { useEffect, useRef } from 'react';
import type { MouseEvent, PointerEvent } from 'react';

/** Px de arrastre vertical para empezar a desplazar (no roba clicks). */
const UMBRAL_INICIO = 8;

export function useArrastreScroll() {
  /** Va en el ref del contenedor scrolleable (habilita la rueda). */
  const contenedor = useRef<HTMLDivElement | null>(null);
  const inicio = useRef<{ x: number; y: number; scrollTop: number } | null>(null);
  const desplazando = useRef(false);
  const huboArrastre = useRef(false);

  useEffect(() => {
    const elemento = contenedor.current;
    if (!elemento) return;
    // Listener propio no pasivo: la rueda siempre desplaza el contenedor.
    function alRodar(evento: WheelEvent) {
      const el = contenedor.current;
      if (!el) return;
      evento.preventDefault();
      el.scrollTop += evento.deltaY;
    }
    elemento.addEventListener('wheel', alRodar, { passive: false });
    return () => elemento.removeEventListener('wheel', alRodar);
  }, []);

  function alPresionar(evento: PointerEvent<HTMLDivElement>) {
    inicio.current = {
      x: evento.clientX,
      y: evento.clientY,
      scrollTop: evento.currentTarget.scrollTop,
    };
  }

  function alMover(evento: PointerEvent<HTMLDivElement>) {
    if (!inicio.current) return;
    const dx = evento.clientX - inicio.current.x;
    const dy = evento.clientY - inicio.current.y;

    if (!desplazando.current) {
      // Solo es scroll si el gesto es claramente vertical.
      if (Math.abs(dy) < UMBRAL_INICIO || Math.abs(dy) < Math.abs(dx)) return;
      desplazando.current = true;
      // La captura garantiza seguir el gesto aunque salga del contenedor.
      evento.currentTarget.setPointerCapture(evento.pointerId);
    }
    evento.currentTarget.scrollTop = inicio.current.scrollTop - dy;
  }

  function alSoltar(evento: PointerEvent<HTMLDivElement>) {
    if (desplazando.current) {
      huboArrastre.current = true;
      evento.currentTarget.releasePointerCapture?.(evento.pointerId);
    }
    desplazando.current = false;
    inicio.current = null;
  }

  /** Va en onClickCapture del contenedor: anula el click tras arrastrar. */
  function alCapturarClick(evento: MouseEvent<HTMLDivElement>) {
    if (!huboArrastre.current) return;
    huboArrastre.current = false;
    evento.preventDefault();
    evento.stopPropagation();
  }

  return { contenedor, alPresionar, alMover, alSoltar, alCapturarClick };
}
