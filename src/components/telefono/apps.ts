/**
 * Registro de las apps simuladas del home y su mapeo canal→app.
 * Datos puros de presentacion: sin React, sin reglas de juego.
 */

import type { CanalMensaje } from '../../types/escenario';
import type { AppId } from './maquina';
import iconoWhatsapp from '../../assets/img/icon_whatsapp.png';
import iconoMensajes from '../../assets/img/Icon_message.svg';
import iconoMail from '../../assets/img/Icon_mail.svg';
import iconoDiscord from '../../assets/img/icono_discord.svg';
import iconoRoblox from '../../assets/img/icono_roblox.svg';
import iconoCamara from '../../assets/img/Icon_camera.svg';
import iconoSafari from '../../assets/img/Icon_safari.svg';
import iconoAjustes from '../../assets/img/icon_settings.svg';

export interface AppSimulada {
  id: AppId;
  /** Nombre visible bajo el icono del home. */
  nombre: string;
  /** Canal del banco de escenarios que esta app renderiza. */
  canal: CanalMensaje;
  /** Emoji de respaldo cuando no hay imagen; decorativo (aria-hidden). */
  glifo: string;
  /** Imagen del icono (asset local). */
  icono?: string;
  /** true si la imagen ya trae su propio fondo (icono iOS completo). */
  iconoConFondo?: boolean;
  /** Clases de token para el fondo del icono (glifos y respaldo). */
  claseIcono: string;
  /** Clases de token para el fondo interno de la app abierta. */
  claseFondo: string;
}

/** Apps del home, en el orden del grid. Cubre todos los canales del contrato. */
export const APPS: readonly AppSimulada[] = [
  {
    id: 'whatsapp',
    nombre: 'WhatsApp',
    canal: 'whatsapp',
    glifo: '📞',
    icono: iconoWhatsapp,
    iconoConFondo: true,
    claseIcono: 'bg-[var(--color-app-whatsapp)]',
    claseFondo: 'bg-[var(--color-app-whatsapp-fondo)]',
  },
  {
    id: 'mensajes',
    nombre: 'Mensajes',
    canal: 'sms',
    glifo: '💬',
    icono: iconoMensajes,
    iconoConFondo: true,
    claseIcono: 'bg-[var(--color-app-mensajes)]',
    claseFondo: 'bg-[var(--color-app-mensajes-fondo)]',
  },
  {
    id: 'discord',
    nombre: 'Discord',
    canal: 'discord',
    glifo: '🎮',
    icono: iconoDiscord,
    iconoConFondo: false,
    claseIcono: 'bg-[var(--color-app-discord)]',
    claseFondo: 'bg-[var(--color-app-discord-fondo)]',
  },
  {
    id: 'gmail',
    nombre: 'Mail',
    canal: 'correo',
    glifo: '✉️',
    icono: iconoMail,
    iconoConFondo: true,
    claseIcono: 'bg-[var(--color-app-gmail)]',
    claseFondo: 'bg-[var(--color-app-gmail-fondo)]',
  },
  {
    id: 'chat-juego',
    nombre: 'Roblox',
    canal: 'chat-juego',
    glifo: '🧱',
    icono: iconoRoblox,
    iconoConFondo: false,
    claseIcono: 'bg-[var(--color-carcasa)]',
    claseFondo: 'bg-[var(--color-app-chat-juego-fondo)]',
  },
];

/** Apps de relleno del home, sin accion: solo dan realismo al telefono. */
export const DECORATIVAS = [
  { nombre: 'Camara', icono: iconoCamara },
  { nombre: 'Safari', icono: iconoSafari },
  { nombre: 'Ajustes', icono: iconoAjustes },
] as const;

/**
 * App que renderiza un canal. Es total por construccion: el test de
 * exhaustividad en apps.test.ts falla en compilacion si el contrato
 * agrega un canal sin app registrada.
 */
export function appPorCanal(canal: CanalMensaje): AppSimulada {
  const app = APPS.find((candidata) => candidata.canal === canal);
  if (!app) {
    throw new Error(`Canal sin app registrada: ${canal}`);
  }
  return app;
}
