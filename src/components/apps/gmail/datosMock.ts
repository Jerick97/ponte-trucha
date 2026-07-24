/**
 * Datos decorativos de la bandeja de Gmail: cuenta del jugador, filas de
 * categorias (Notificaciones/Promociones) y correos de relleno creibles
 * para un nino. Datos puros de presentacion: sin React ni reglas de juego.
 */

export const CUENTA_GM = {
  nombre: 'SuperTrucha',
  correo: 'supertrucha@gmail.com',
  inicial: 'S',
  claseAvatar: 'bg-[var(--color-gm-avatar-verde)]',
};

export interface CorreoMockGm {
  id: string;
  remitente: string;
  asunto: string;
  vistaPrevia: string;
  fecha: string;
  inicial: string;
  claseAvatar: string;
}

/** Correos de relleno de la bandeja Principal, bajo el del escenario. */
export const CORREOS_GM: CorreoMockGm[] = [
  {
    id: 'duolingo',
    remitente: 'Duolingo',
    asunto: '😳 No vas a abandonar tu racha, ¿no?',
    vistaPrevia: 'Solo una lección salvará tu racha',
    fecha: '21 jul',
    inicial: 'D',
    claseAvatar: 'bg-[var(--color-gm-avatar-verde)]',
  },
  {
    id: 'google',
    remitente: 'Google',
    asunto: 'Alerta de seguridad',
    vistaPrevia: 'Se inició sesión en tu cuenta desde una tablet',
    fecha: '20 jul',
    inicial: 'G',
    claseAvatar: 'bg-[var(--color-gm-avatar-azul)]',
  },
  {
    id: 'colegio',
    remitente: 'Miss Rosario',
    asunto: 'Tarea de Ciencias para el lunes',
    vistaPrevia: 'Recuerden traer su maqueta del sistema solar',
    fecha: '20 jul',
    inicial: 'M',
    claseAvatar: 'bg-[var(--color-gm-avatar-naranja)]',
  },
  {
    id: 'scratch',
    remitente: 'Scratch',
    asunto: 'Tu proyecto recibió una estrella',
    vistaPrevia: 'A PixelDany le encantó tu juego del gato',
    fecha: '18 jul',
    inicial: 'S',
    claseAvatar: 'bg-[var(--color-gm-avatar-morado)]',
  },
  {
    id: 'biblioteca',
    remitente: 'Biblioteca del cole',
    asunto: 'Ya llegó el libro que pediste',
    vistaPrevia: 'Puedes recogerlo en el recreo de mañana',
    fecha: '17 jul',
    inicial: 'B',
    claseAvatar: 'bg-[var(--color-gm-avatar-azul)]',
  },
];

export interface CategoriaGm {
  id: 'notificaciones' | 'promociones';
  nombre: string;
  vistaPrevia: string;
  etiqueta: string;
}

/** Tarjetitas separadoras de categorias, como en la bandeja real. */
export const CATEGORIAS_GM: CategoriaGm[] = [
  {
    id: 'notificaciones',
    nombre: 'Notificaciones',
    vistaPrevia: 'Roblox: Tu código de verificación…',
    etiqueta: '+ de 99 nuevos',
  },
  {
    id: 'promociones',
    nombre: 'Promociones',
    vistaPrevia: 'Duolingo — Reto de verano ⭐…',
    etiqueta: '15 nuevo',
  },
];

/** Clases de avatar disponibles para el remitente del escenario. */
const CLASES_AVATAR = [
  'bg-[var(--color-gm-avatar-azul)]',
  'bg-[var(--color-gm-avatar-verde)]',
  'bg-[var(--color-gm-avatar-morado)]',
  'bg-[var(--color-gm-avatar-naranja)]',
];

/**
 * Color determinista para el avatar de inicial del remitente: Gmail pinta
 * un circulo de color con la primera letra cuando no hay foto.
 */
export function claseAvatarRemitente(nombre: string): string {
  let suma = 0;
  for (const letra of nombre) suma += letra.codePointAt(0) ?? 0;
  return CLASES_AVATAR[suma % CLASES_AVATAR.length];
}

/**
 * Divide el mensaje del banco en asunto y cuerpo: el contrato no trae
 * asunto, asi que se usa la primera oracion (o los primeros ~60
 * caracteres) como en los correos reales, que repiten el asunto al abrir.
 */
export function asuntoDe(mensaje: string): string {
  const corte = mensaje.search(/[.!?]/);
  // El punto se descarta (un asunto no termina en punto), ! y ? se quedan.
  const fin = corte > 8 ? corte + (mensaje[corte] === '.' ? 0 : 1) : mensaje.length;
  const asunto = mensaje.slice(0, fin);
  return asunto.length > 60 ? `${asunto.slice(0, 57)}…` : asunto;
}
