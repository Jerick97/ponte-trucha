/**
 * Pantalla de bloqueo: hora y fecha simuladas sobre el wallpaper.
 * Desbloqueo por gesto (arrastre hacia arriba) y por boton accesible.
 */

import { useRef } from 'react';
import type { PointerEvent } from 'react';
import { StatusBar } from './StatusBar';
import { FECHA_SIMULADA, HORA_SIMULADA } from './simulados';

/** Cuantos px hacia arriba cuenta como gesto de desbloqueo. */
const UMBRAL_GESTO = 60;

interface Props {
  onDesbloquear: () => void;
}

export function PantallaBloqueo({ onDesbloquear }: Props) {
  const inicioY = useRef<number | null>(null);

  function alPresionar(evento: PointerEvent<HTMLDivElement>) {
    inicioY.current = evento.clientY;
  }

  function alSoltar(evento: PointerEvent<HTMLDivElement>) {
    if (inicioY.current !== null && inicioY.current - evento.clientY > UMBRAL_GESTO) {
      onDesbloquear();
    }
    inicioY.current = null;
  }

  return (
    <div
      className="wallpaper flex h-full touch-none select-none flex-col"
      onPointerDown={alPresionar}
      onPointerUp={alSoltar}
    >
      <StatusBar claro />

      <div className="mt-14 flex flex-col items-center gap-2 text-[var(--color-lock-texto)]">
        <span aria-hidden="true" className="text-xl">
          🔒
        </span>
        <span className="font-[family-name:var(--font-display)] text-6xl font-bold">
          {HORA_SIMULADA}
        </span>
        <span className="text-sm capitalize opacity-80">{FECHA_SIMULADA}</span>
      </div>

      <div className="mt-auto flex flex-col items-center gap-3 pb-6">
        <button
          type="button"
          onClick={onDesbloquear}
          className="min-h-14 rounded-full bg-[var(--color-lock-texto)]/15 px-8 text-sm font-semibold text-[var(--color-lock-texto)] backdrop-blur focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-marca-500)]"
        >
          Desliza hacia arriba para desbloquear
        </button>
        <span aria-hidden="true" className="h-1 w-32 rounded-full bg-[var(--color-lock-texto)]/60" />
      </div>
    </div>
  );
}
