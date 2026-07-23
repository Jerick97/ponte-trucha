/** Cara posterior del telefono: modulo de camaras y logo. Solo decoracion. */

import logoApple from '../../assets/img/icono_apple.svg';

export function ParteTrasera() {
  return (
    <div
      className="cara cara-trasera absolute inset-0 overflow-hidden rounded-[var(--radius-telefono)] border-[6px] border-[var(--color-carcasa)] bg-[var(--color-carcasa)] shadow-2xl"
      aria-hidden="true"
    >
      <div className="wallpaper absolute inset-0 opacity-40" />

      {/* Modulo de camaras */}
      <div className="absolute left-4 top-4 grid h-28 w-28 grid-cols-2 place-items-center rounded-3xl bg-[var(--color-pantalla-apagada)]/60 p-2 shadow-lg">
        <span className="h-9 w-9 rounded-full border-4 border-[var(--color-carcasa-borde)] bg-[var(--color-pantalla-apagada)] shadow-inner" />
        <span className="h-9 w-9 rounded-full border-4 border-[var(--color-carcasa-borde)] bg-[var(--color-pantalla-apagada)] shadow-inner" />
        <span className="h-9 w-9 rounded-full border-4 border-[var(--color-carcasa-borde)] bg-[var(--color-pantalla-apagada)] shadow-inner" />
        <span className="h-4 w-4 rounded-full bg-[var(--color-notificacion-fondo)]/80" />
      </div>

      {/* Logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img src={logoApple} alt="" draggable={false} className="h-14 w-14 opacity-80" />
      </div>
    </div>
  );
}
