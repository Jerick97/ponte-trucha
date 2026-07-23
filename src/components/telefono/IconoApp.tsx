/** Icono de app del home: imagen iOS (o glifo de respaldo), nombre y badge. */

import type { AppSimulada } from './apps';

interface Props {
  app: AppSimulada;
  /** Muestra el badge rojo de mensaje sin abrir. */
  conBadge?: boolean;
  onAbrir: (app: AppSimulada) => void;
  /** Oculta el nombre (estilo dock de iOS). */
  sinNombre?: boolean;
}

export function IconoApp({ app, conBadge = false, onAbrir, sinNombre = false }: Props) {
  return (
    <button
      type="button"
      onClick={() => onAbrir(app)}
      className="flex w-16 flex-col items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-marca-500)]"
    >
      <span
        className={`relative flex h-14 w-14 items-center justify-center overflow-visible rounded-[1rem] text-2xl shadow-md ${
          app.icono && app.iconoConFondo ? '' : app.claseIcono
        }`}
      >
        {app.icono ? (
          <img
            src={app.icono}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={
              app.iconoConFondo
                ? 'h-14 w-14 rounded-[1rem] object-cover'
                : 'h-8 w-8 object-contain'
            }
          />
        ) : (
          <span aria-hidden="true">{app.glifo}</span>
        )}
        {conBadge && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-trampa)] px-1 text-[11px] font-bold text-[var(--color-lock-texto)]">
            1<span className="sr-only"> mensaje sin abrir</span>
          </span>
        )}
      </span>
      {!sinNombre && (
        <span className="max-w-16 truncate text-[11px] text-[var(--color-lock-texto)] [text-shadow:0_1px_2px_rgba(0,0,0,.6)]">
          {app.nombre}
        </span>
      )}
    </button>
  );
}
