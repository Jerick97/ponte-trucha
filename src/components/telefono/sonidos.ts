/**
 * Sonidos del sistema del telefono simulado. Se autodetectan desde
 * src/assets/audio/sonidos por palabras clave en el nombre del archivo;
 * si falta alguno, el evento simplemente no suena. Todo es local: cero
 * recursos externos.
 */

export type SonidoSistema = 'encendido' | 'apagado' | 'bloqueo' | 'notificacion' | 'obturador';

const archivos = import.meta.glob('../../assets/audio/sonidos/*.{mp3,ogg,m4a,wav}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const PATRONES: Record<SonidoSistema, RegExp> = {
  encendido: /startup|encend|arranque|power ?on/,
  apagado: /shutdown|apag|power ?off/,
  bloqueo: /lock|bloqueo/,
  notificacion: /notif|alert|message|mensaje/,
  obturador: /camera|camara|shutter|obturador/,
};

function buscar(patron: RegExp): string | undefined {
  const par = Object.entries(archivos).find(([ruta]) =>
    patron.test((ruta.split('/').pop() ?? ruta).toLowerCase()),
  );
  return par?.[1];
}

const SONIDOS: Partial<Record<SonidoSistema, string>> = {
  encendido: buscar(PATRONES.encendido),
  apagado: buscar(PATRONES.apagado),
  bloqueo: buscar(PATRONES.bloqueo),
  notificacion: buscar(PATRONES.notificacion),
  obturador: buscar(PATRONES.obturador),
};

/**
 * Reproduce un sonido del sistema. Silencioso si el archivo no existe o
 * el navegador bloquea el audio (siempre se dispara tras un gesto del
 * usuario, asi que en la practica suena).
 */
export function reproducirSonido(sonido: SonidoSistema) {
  const src = SONIDOS[sonido];
  if (!src) return;
  const audio = new Audio(src);
  audio.volume = 0.5;
  void audio.play().catch(() => {
    // Sin permiso de audio: el simulador sigue funcionando en silencio.
  });
}
