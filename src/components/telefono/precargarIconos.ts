/**
 * Precarga las imagenes de los iconos mientras el telefono arranca,
 * para que el home no muestre iconos vacios al desbloquear.
 */

import { APPS, DECORATIVAS } from './apps';

let precargado = false;

export function precargarIconos(): void {
  if (precargado || typeof Image === 'undefined') return;
  precargado = true;

  const fuentes = [
    ...APPS.map((app) => app.icono),
    ...DECORATIVAS.map((extra) => extra.icono),
  ].filter((fuente): fuente is string => Boolean(fuente));

  for (const fuente of fuentes) {
    const imagen = new Image();
    imagen.src = fuente;
  }
}
