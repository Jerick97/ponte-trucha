/**
 * Sonidos propios de la app de Gmail. Viven en su subcarpeta
 * (src/assets/audio/sonidos/gmail) para no chocar con los del sistema
 * iOS: el glob de sonidos.ts solo mira el nivel superior y este solo la
 * subcarpeta. Se autodetectan por palabras clave en el nombre.
 */

import { estaSilenciado } from '../../../store/audio';

export type SonidoGmail = 'notificacion';

const archivos = import.meta.glob('../../../assets/audio/sonidos/gmail/*.{mp3,ogg,m4a,wav}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const PATRONES: Record<SonidoGmail, RegExp> = {
  notificacion: /notif|alert|message|mensaje|sound|gmail|google|chat/,
};

function buscar(patron: RegExp): string | undefined {
  const par = Object.entries(archivos).find(([ruta]) =>
    patron.test((ruta.split('/').pop() ?? ruta).toLowerCase()),
  );
  return par?.[1];
}

const SONIDOS: Partial<Record<SonidoGmail, string>> = {
  notificacion: buscar(PATRONES.notificacion),
};

/** Reproduce un sonido de Gmail; silencioso si falta el archivo. */
export function reproducirSonidoGm(sonido: SonidoGmail) {
  if (estaSilenciado()) return;
  const src = SONIDOS[sonido];
  if (!src) return;
  const audio = new Audio(src);
  audio.volume = 0.5;
  void audio.play().catch(() => {
    // Sin permiso de audio: el simulador sigue funcionando en silencio.
  });
}
