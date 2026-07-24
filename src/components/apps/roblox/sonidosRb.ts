/**
 * Sonidos propios de la app de Roblox. Viven en su subcarpeta
 * (src/assets/audio/sonidos/roblox) para no chocar con los del sistema
 * iOS: el glob de sonidos.ts solo mira el nivel superior y este solo la
 * subcarpeta. Se autodetectan por palabras clave en el nombre.
 */

export type SonidoRoblox = 'notificacion';

const archivos = import.meta.glob('../../../assets/audio/sonidos/roblox/*.{mp3,ogg,m4a,wav}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const PATRONES: Record<SonidoRoblox, RegExp> = {
  notificacion: /notif|alert|message|mensaje|sound|roblox/,
};

function buscar(patron: RegExp): string | undefined {
  const par = Object.entries(archivos).find(([ruta]) =>
    patron.test((ruta.split('/').pop() ?? ruta).toLowerCase()),
  );
  return par?.[1];
}

const SONIDOS: Partial<Record<SonidoRoblox, string>> = {
  notificacion: buscar(PATRONES.notificacion),
};

/** Reproduce un sonido de Roblox; silencioso si falta el archivo. */
export function reproducirSonidoRb(sonido: SonidoRoblox) {
  const src = SONIDOS[sonido];
  if (!src) return;
  const audio = new Audio(src);
  audio.volume = 0.5;
  void audio.play().catch(() => {
    // Sin permiso de audio: el simulador sigue funcionando en silencio.
  });
}
