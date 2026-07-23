/**
 * Registro de las apps simuladas del home y su mapeo canal→app.
 * Datos puros de presentacion: sin React, sin reglas de juego.
 */

import type { CanalMensaje } from '../../types/escenario';
import type { AppId } from './maquina';

export interface AppSimulada {
  id: AppId;
  /** Nombre visible bajo el icono del home. */
  nombre: string;
  /** Canal del banco de escenarios que esta app renderiza. */
  canal: CanalMensaje;
  /** Clases de token para pintar el icono. Los tokens viven en @theme. */
  claseIcono: string;
}

/** Apps del home, en el orden del grid. Cubre todos los canales del contrato. */
export const APPS: readonly AppSimulada[] = [
  {
    id: 'whatsapp',
    nombre: 'WhatsApp',
    canal: 'whatsapp',
    claseIcono: 'bg-[var(--color-app-whatsapp)]',
  },
  {
    id: 'mensajes',
    nombre: 'Mensajes',
    canal: 'sms',
    claseIcono: 'bg-[var(--color-app-mensajes)]',
  },
  {
    id: 'discord',
    nombre: 'Discord',
    canal: 'discord',
    claseIcono: 'bg-[var(--color-app-discord)]',
  },
  {
    id: 'gmail',
    nombre: 'Gmail',
    canal: 'correo',
    claseIcono: 'bg-[var(--color-app-gmail)]',
  },
  {
    id: 'chat-juego',
    nombre: 'MundoBloques',
    canal: 'chat-juego',
    claseIcono: 'bg-[var(--color-app-chat-juego)]',
  },
];

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
