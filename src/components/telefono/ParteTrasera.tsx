/**
 * Cara posterior del telefono: modulo de camaras (3 lentes, flash y
 * sensor) y logo. El flash es la linterna del simulador: se enciende
 * desde el boton de linterna de la pantalla de bloqueo.
 */

import logoApple from '../../assets/img/icono_apple.svg';

interface Props {
  linternaEncendida: boolean;
}

export function ParteTrasera({ linternaEncendida }: Props) {
  return (
    <div
      className="cara cara-trasera cara-marco absolute inset-0 overflow-hidden rounded-[var(--radius-telefono)] border-[6px] border-[var(--color-carcasa)] bg-[var(--color-carcasa)]"
      aria-hidden="true"
    >
      <div className="wallpaper absolute inset-0 opacity-30" />
      <div className="brillo-trasero absolute inset-0" />

      {/* Modulo de camaras estilo iPhone 12: lentes en triangulo */}
      <div className="modulo-camaras absolute left-5 top-5 h-40 w-40 rounded-[2rem]">
        <span className="camara-lente left-2.5 top-2.5" />
        <span className="camara-lente bottom-2.5 left-2.5" />
        <span className="camara-lente right-2.5 top-1/2 -translate-y-1/2" />
        <span className={`flash-trasero right-4 top-4 ${linternaEncendida ? 'encendido' : ''}`} />
        <span className="sensor-trasero bottom-4 right-4" />
      </div>

      {/* Logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img src={logoApple} alt="" draggable={false} className="h-20 w-20 opacity-80" />
      </div>
    </div>
  );
}
