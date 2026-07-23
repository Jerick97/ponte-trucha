/**
 * Contenedor interino de una app abierta: header con identidad del canal,
 * boton de volver al home y fondo propio. Las vistas definitivas por app
 * llegan en las tareas 13 y 14 de la spec interfaz-telefono.
 */

import type { ReactNode } from 'react';
import type { AppSimulada } from '../telefono/apps';
import { StatusBar } from '../telefono/StatusBar';

interface Props {
  app: AppSimulada;
  titulo: string;
  subtitulo?: string;
  avatar?: string;
  onVolver: () => void;
  children: ReactNode;
}

export function VistaApp({ app, titulo, subtitulo, avatar, onVolver, children }: Props) {
  return (
    <div className={`flex h-full flex-col ${app.claseFondo}`}>
      <div className={`${app.claseIcono} pb-2 text-[var(--color-lock-texto)]`}>
        <StatusBar claro />
        <div className="flex items-center gap-2 px-3">
          <button
            type="button"
            onClick={onVolver}
            aria-label={`Volver al inicio desde ${app.nombre}`}
            className="flex h-11 w-11 items-center justify-center rounded-full text-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-lock-texto)]"
          >
            ‹
          </button>
          {avatar && (
            <span aria-hidden="true" className="text-2xl">
              {avatar}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-bold leading-tight">{titulo}</p>
            {subtitulo && <p className="truncate text-xs opacity-80">{subtitulo}</p>}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">{children}</div>
    </div>
  );
}
