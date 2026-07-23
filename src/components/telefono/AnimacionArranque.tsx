/**
 * Secuencia de arranque sobre pantalla negra: el logo aparece y luego
 * se amplia hasta "revelar" la pantalla. Avisa al terminar la ultima
 * animacion CSS; no usa timers propios.
 */

import type { AnimationEvent } from 'react';
import logoApple from '../../assets/img/icono_apple.svg';

interface Props {
  onFin: () => void;
}

export function AnimacionArranque({ onFin }: Props) {
  function alTerminarAnimacion(evento: AnimationEvent<HTMLImageElement>) {
    if (evento.animationName === 'arranque-zoom') onFin();
  }

  return (
    <div className="flex h-full items-center justify-center overflow-hidden bg-[var(--color-pantalla-apagada)]">
      <img
        src={logoApple}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="logo-arranque h-16 w-16"
        onAnimationEnd={alTerminarAnimacion}
      />
      <span className="sr-only">Encendiendo el telefono…</span>
    </div>
  );
}
