/** Banner de notificacion del home: remitente + probadita del mensaje. */

import type { AppSimulada } from './apps';
import { recortarVistaPrevia } from './vistaPrevia';

interface Props {
  app: AppSimulada;
  remitente: string;
  mensaje: string;
  onAbrir: () => void;
}

export function BannerNotificacion({ app, remitente, mensaje, onAbrir }: Props) {
  return (
    <button
      type="button"
      onClick={onAbrir}
      className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-[var(--color-notificacion-fondo)] p-3 text-left shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-marca-500)]"
    >
      <span
        aria-hidden="true"
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${app.claseIcono}`}
      >
        {app.glifo}
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--color-texto-suave)]">
          {app.nombre} · ahora
        </span>
        <span className="block truncate text-sm font-bold text-[var(--color-texto)]">
          {remitente}
        </span>
        <span className="block text-sm text-[var(--color-texto)]">
          {recortarVistaPrevia(mensaje)}
        </span>
      </span>
    </button>
  );
}
