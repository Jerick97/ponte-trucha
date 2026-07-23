/**
 * Tarjeta de notificacion de la pantalla de bloqueo, estilo iOS:
 * translucida oscura, icono de la app, titulo en negrita y texto.
 * Tocarla desbloquea y abre lo que corresponda (decide App).
 */

import { IconoEscudo } from './Iconos';
import { recortarVistaPrevia } from './vistaPrevia';

export interface DatosNotificacionBloqueo {
  /** Icono de la app que notifica; sin imagen se usa el escudo del juego. */
  imagen?: string;
  /** true si la imagen ya trae su propio fondo (icono iOS completo). */
  imagenConFondo?: boolean;
  /** Clases de token para el fondo del icono cuando la imagen es un glifo. */
  claseImagen?: string;
  titulo: string;
  /** Nombre de la app, en la cabecera pequenia. */
  app: string;
  texto: string;
}

interface Props {
  datos: DatosNotificacionBloqueo;
  onAbrir: () => void;
}

export function NotificacionBloqueo({ datos, onAbrir }: Props) {
  return (
    <button
      type="button"
      onClick={onAbrir}
      className="mx-6 flex min-h-14 items-start gap-3 rounded-2xl bg-[var(--color-pantalla-apagada)]/45 p-3 text-left text-[var(--color-lock-texto)] backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-marca-500)]"
    >
      <span
        aria-hidden="true"
        className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg ${
          datos.imagen && datos.imagenConFondo ? '' : (datos.claseImagen ?? '')
        }`}
      >
        {datos.imagen ? (
          <img
            src={datos.imagen}
            alt=""
            draggable={false}
            className={datos.imagenConFondo ? 'h-9 w-9 rounded-lg object-cover' : 'h-5 w-5 object-contain'}
          />
        ) : (
          <IconoEscudo className="h-7 w-7 text-[var(--color-marca-500)]" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-wide opacity-70">
          {datos.app} · ahora
        </span>
        <span className="block truncate text-sm font-bold">{datos.titulo}</span>
        <span className="block text-sm opacity-90">{recortarVistaPrevia(datos.texto)}</span>
      </span>
    </button>
  );
}
