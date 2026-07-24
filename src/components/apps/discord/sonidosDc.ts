/**
 * Sonidos propios de la app de Discord. Viven en su subcarpeta
 * (src/assets/audio/sonidos/discord) para no chocar con los del sistema
 * iOS: el glob de sonidos.ts solo mira el nivel superior y este solo la
 * subcarpeta. Se autodetectan por palabras clave en el nombre.
 */

import { estaSilenciado } from '../../../store/audio';

export type SonidoDiscord = 'ping';

const archivos = import.meta.glob('../../../assets/audio/sonidos/discord/*.{mp3,ogg,m4a,wav}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const PATRONES: Record<SonidoDiscord, RegExp> = {
  ping: /ping|message|mensaje/,
};

function buscar(patron: RegExp): string | undefined {
  const par = Object.entries(archivos).find(([ruta]) =>
    patron.test((ruta.split('/').pop() ?? ruta).toLowerCase()),
  );
  return par?.[1];
}

const SONIDOS: Partial<Record<SonidoDiscord, string>> = {
  ping: buscar(PATRONES.ping),
};

/** Reproduce un sonido de Discord; silencioso si falta el archivo. */
export function reproducirSonidoDc(sonido: SonidoDiscord) {
  if (estaSilenciado()) return;
  const src = SONIDOS[sonido];
  if (!src) return;
  const audio = new Audio(src);
  audio.volume = 0.5;
  void audio.play().catch(() => {
    // Sin permiso de audio: el simulador sigue funcionando en silencio.
  });
}
