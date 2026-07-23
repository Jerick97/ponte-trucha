/**
 * Carcasa fisica del iPhone simulado: bordes, isla dinamica, botones
 * laterales y giro 3D por arrastre horizontal. No conoce fases del juego.
 */

import type { ReactNode } from 'react';
import { ParteTrasera } from './ParteTrasera';
import { useGiroArrastre } from './useGiroArrastre';

interface Props {
  /** Mostrando la parte trasera. */
  girado: boolean;
  /** Ejecutando la animacion de arranque de la carcasa. */
  arrancando: boolean;
  /** El giro por arrastre esta disponible (telefono encendido). */
  puedeGirar: boolean;
  /** El boton lateral derecho (bloquear) esta activo. */
  puedeBloquear: boolean;
  /** Enciende el flash de la parte trasera (linterna del lock screen). */
  linternaEncendida: boolean;
  onGirar: () => void;
  onBloquear: () => void;
  children: ReactNode;
}

export function Iphone({
  girado,
  arrancando,
  puedeGirar,
  puedeBloquear,
  linternaEncendida,
  onGirar,
  onBloquear,
  children,
}: Props) {
  const giro = useGiroArrastre(puedeGirar, onGirar);
  const grados = (girado ? 180 : 0) + giro.deltaGrados;

  return (
    <div
      className="mx-auto h-full w-full max-w-[420px] touch-pan-y px-4 py-3 [perspective:1400px]"
      onPointerDown={giro.alPresionar}
      onPointerMove={giro.alMover}
      onPointerUp={giro.alSoltar}
      onPointerCancel={giro.alSoltar}
      onClickCapture={giro.alCapturarClick}
    >
      <div
        className={`carcasa-3d relative h-full w-full ${
          giro.arrastrando ? '' : 'transition-transform duration-700'
        } ${arrancando ? 'animar-arranque' : ''}`}
        style={arrancando ? undefined : { transform: `rotateY(${grados}deg)` }}
      >
        {/* Botones fisicos izquierdos (decorativos) */}
        <span
          aria-hidden="true"
          className="absolute -left-1 top-24 z-20 h-6 w-1 rounded-full bg-[var(--color-carcasa-borde)]"
        />
        <span
          aria-hidden="true"
          className="absolute -left-1 top-36 z-20 h-10 w-1 rounded-full bg-[var(--color-carcasa-borde)]"
        />
        <span
          aria-hidden="true"
          className="absolute -left-1 top-48 z-20 h-10 w-1 rounded-full bg-[var(--color-carcasa-borde)]"
        />

        {/* Boton lateral derecho: bloquear (Req 2.3) */}
        {puedeBloquear && (
          <button
            type="button"
            aria-label="Bloquear telefono"
            onClick={onBloquear}
            className="absolute -right-3 top-32 z-20 flex w-6 items-center justify-start py-6"
          >
            <span className="h-16 w-1.5 rounded-full bg-[var(--color-carcasa-borde)]" />
          </button>
        )}

        {/* Giro accesible por teclado: invisible salvo con foco (Req 3.1) */}
        {puedeGirar && (
          <button
            type="button"
            onClick={onGirar}
            className="sr-only focus:not-sr-only focus:absolute focus:bottom-2 focus:left-1/2 focus:z-40 focus:-translate-x-1/2 focus:rounded-full focus:bg-[var(--color-carcasa)] focus:px-4 focus:py-2 focus:text-xs focus:text-[var(--color-lock-texto)]"
          >
            {girado ? 'Ver el frente del telefono' : 'Girar telefono'}
          </button>
        )}

        {/* Bandas de antena del canto (detalle del marco metalico) */}
        <span aria-hidden="true" className="banda-antena absolute right-16 top-0 z-20 h-1.5 w-2 rounded-b-sm" />
        <span aria-hidden="true" className="banda-antena absolute bottom-0 left-16 z-20 h-1.5 w-2 rounded-t-sm" />
        <span aria-hidden="true" className="banda-antena absolute left-0 top-20 z-20 h-2 w-1.5 rounded-r-sm" />
        <span aria-hidden="true" className="banda-antena absolute bottom-28 right-0 z-20 h-2 w-1.5 rounded-l-sm" />

        {/* Cara frontal */}
        <div className="cara cara-marco absolute inset-0 overflow-hidden rounded-[var(--radius-telefono)] border-[6px] border-[var(--color-carcasa)] bg-[var(--color-pantalla-apagada)]">
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-2 z-30 h-6 w-24 -translate-x-1/2 rounded-full bg-[var(--color-pantalla-apagada)]"
          />
          {children}
        </div>

        <ParteTrasera linternaEncendida={linternaEncendida} />
      </div>
    </div>
  );
}
