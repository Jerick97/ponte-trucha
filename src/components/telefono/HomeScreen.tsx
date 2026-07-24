/**
 * Home del telefono: wallpaper, notificacion activa, grid de apps
 * (reales + decorativas), puntos de pagina y dock estilo iOS.
 * No sabe de fases: recibe la notificacion (si hay) y emite aperturas.
 */

import type { ReactNode } from 'react';
import type { AppId } from './maquina';
import { APPS, DECORATIVAS, type AppSimulada } from './apps';
import { StatusBar } from './StatusBar';
import { IconoApp } from './IconoApp';
import { BannerNotificacion } from './BannerNotificacion';

export interface NotificacionHome {
  app: AppSimulada;
  remitente: string;
  mensaje: string;
}

interface Props {
  notificacion: NotificacionHome | null;
  /** HUD de partida (ronda, puntaje, racha) que App decide mostrar o no. */
  hud?: ReactNode;
  onAbrirApp: (app: AppSimulada) => void;
  /** Abre la app de camara (app del sistema, sin canal). */
  onAbrirCamara: () => void;
}

const APPS_DOCK: readonly AppId[] = ['whatsapp', 'mensajes', 'discord', 'gmail'];

export function HomeScreen({ notificacion, hud, onAbrirApp, onAbrirCamara }: Props) {
  const dock = APPS.filter((app) => APPS_DOCK.includes(app.id));
  const grid = APPS.filter((app) => !APPS_DOCK.includes(app.id));

  return (
    <div className="wallpaper flex h-full flex-col">
      <StatusBar claro />

      <div className="flex flex-col gap-3 px-4 pt-2" aria-live="polite">
        {hud}
        {notificacion && (
          <>
            <span className="sr-only">
              Nueva notificacion de {notificacion.remitente} en {notificacion.app.nombre}
            </span>
            <BannerNotificacion
              app={notificacion.app}
              remitente={notificacion.remitente}
              mensaje={notificacion.mensaje}
              onAbrir={() => onAbrirApp(notificacion.app)}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-4 gap-x-2 gap-y-5 px-5 pt-6">
        {grid.map((app) => (
          <IconoApp
            key={app.id}
            app={app}
            conBadge={notificacion?.app.id === app.id}
            onAbrir={onAbrirApp}
          />
        ))}
        {DECORATIVAS.map((extra) => {
          // La camara es la unica "decorativa" con app real detras.
          const esCamara = extra.nombre === 'Camara';
          const Etiqueta = esCamara ? 'button' : 'div';
          return (
            <Etiqueta
              key={extra.nombre}
              {...(esCamara
                ? { type: 'button' as const, onClick: onAbrirCamara, 'aria-label': 'Abrir la cámara' }
                : { 'aria-hidden': true })}
              className="flex w-16 flex-col items-center gap-1"
            >
              <img
                src={extra.icono}
                alt=""
                draggable={false}
                className="h-14 w-14 rounded-[1rem] object-cover shadow-md"
              />
              <span className="text-[11px] text-[var(--color-lock-texto)] [text-shadow:0_1px_2px_rgba(0,0,0,.6)]">
                {extra.nombre}
              </span>
            </Etiqueta>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col items-center gap-2 px-3 pb-3">
        {/* Puntos de pagina */}
        <div aria-hidden="true" className="flex gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-lock-texto)]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-lock-texto)]/40" />
        </div>
        <div className="flex w-full items-center justify-around rounded-[1.9rem] bg-[var(--color-lock-texto)]/15 px-3 py-3.5 backdrop-blur-md">
          {dock.map((app) => (
            <IconoApp
              key={app.id}
              app={app}
              conBadge={notificacion?.app.id === app.id}
              onAbrir={onAbrirApp}
              sinNombre
            />
          ))}
        </div>
      </div>
    </div>
  );
}
