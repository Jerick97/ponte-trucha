/**
 * Sonidos propios de la app de WhatsApp. Viven en su subcarpeta
 * (src/assets/audio/sonidos/whatsapp) para no chocar con los del sistema
 * iOS: el glob de sonidos.ts solo mira el nivel superior y este solo la
 * subcarpeta. Se autodetectan por palabras clave en el nombre.
 */

export type SonidoWhatsApp = 'notificacion';

const archivos = import.meta.glob('../../../assets/audio/sonidos/whatsapp/*.{mp3,ogg,m4a,wav}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const PATRONES: Record<SonidoWhatsApp, RegExp> = {
  notificacion: /notif|alert|message|mensaje/,
};

function buscar(patron: RegExp): string | undefined {
  const par = Object.entries(archivos).find(([ruta]) =>
    patron.test((ruta.split('/').pop() ?? ruta).toLowerCase()),
  );
  return par?.[1];
}

const SONIDOS: Partial<Record<SonidoWhatsApp, string>> = {
  notificacion: buscar(PATRONES.notificacion),
};

/** Reproduce un sonido de WhatsApp; silencioso si falta el archivo. */
export function reproducirSonidoWa(sonido: SonidoWhatsApp) {
  const src = SONIDOS[sonido];
  if (!src) return;
  const audio = new Audio(src);
  audio.volume = 0.5;
  void audio.play().catch(() => {
    // Sin permiso de audio: el simulador sigue funcionando en silencio.
  });
}
