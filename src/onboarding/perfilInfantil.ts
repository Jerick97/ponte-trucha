/**
 * Perfil infantil sin PII.
 *
 * Reglas que aplica (R4 de la spec, `seguridad-infantil.md`):
 * - el apodo y el avatar se ELIGEN de un catalogo, no se escriben;
 *   asi es imposible que el nino teclee su nombre real;
 * - la edad se guarda como banda (`8-10` / `11-13`), nunca como fecha;
 * - el `childId` es aleatorio y opaco: no se deriva del apodo ni de la banda;
 * - nada de correo, telefono, foto, voz ni ubicacion.
 *
 * Logica pura: no toca React, storage ni red.
 */

export type BandaEtaria = '8-10' | '11-13';

export interface OpcionCatalogo {
  id: string;
  etiqueta: string;
}

export interface OpcionAvatar extends OpcionCatalogo {
  /** Emoji: cero peso extra y sin foto real de por medio. */
  emoji: string;
}

export interface Banda {
  clave: BandaEtaria;
  etiqueta: string;
  /** Que cambia en el juego con esta banda. */
  detalle: string;
}

/**
 * Apodos de catalogo. Son motes de "buen detector", con sabor peruano suave
 * (`tono-infantil.md`) y ninguno es nombre de persona.
 */
export const ALIAS_CATALOGO: readonly OpcionCatalogo[] = [
  { id: 'ojo-de-aguila', etiqueta: 'Ojo de Águila' },
  { id: 'trucha-veloz', etiqueta: 'Trucha Veloz' },
  { id: 'detective-cuy', etiqueta: 'Detective Cuy' },
  { id: 'capitan-alerta', etiqueta: 'Capitán Alerta' },
  { id: 'rayo-andino', etiqueta: 'Rayo Andino' },
  { id: 'zorro-listo', etiqueta: 'Zorro Listo' },
  { id: 'tigre-atento', etiqueta: 'Tigre Atento' },
  { id: 'buho-nocturno', etiqueta: 'Búho Nocturno' },
] as const;

export const AVATARES_CATALOGO: readonly OpcionAvatar[] = [
  { id: 'aguila', etiqueta: 'Águila', emoji: '🦅' },
  { id: 'cuy', etiqueta: 'Cuy', emoji: '🐹' },
  { id: 'zorro', etiqueta: 'Zorro', emoji: '🦊' },
  { id: 'tigre', etiqueta: 'Tigre', emoji: '🐯' },
  { id: 'buho', etiqueta: 'Búho', emoji: '🦉' },
  { id: 'llama', etiqueta: 'Llama', emoji: '🦙' },
  { id: 'pulpo', etiqueta: 'Pulpo', emoji: '🐙' },
  { id: 'rana', etiqueta: 'Rana', emoji: '🐸' },
] as const;

export const BANDAS: readonly Banda[] = [
  {
    clave: '8-10',
    etiqueta: '8 a 10 años',
    detalle: 'Mensajes más directos y pistas más visibles.',
  },
  {
    clave: '11-13',
    etiqueta: '11 a 13 años',
    detalle: 'Trampas más elaboradas y menos ayuda en pantalla.',
  },
] as const;

/**
 * Perfiles por cuenta adulta. Debe coincidir con
 * `MAX_CHILD_PROFILES_PER_PARENT` del backend: el servidor es quien manda y
 * responde 409 al pasarse; esto solo evita ofrecer un boton que va a fallar.
 */
export const MAX_PERFILES = 4;

export interface SeleccionPerfil {
  aliasId: string;
  avatarId: string;
  banda: BandaEtaria;
}

/** Perfil final. Estos cinco campos son TODO lo que existe de un nino. */
export interface PerfilInfantil {
  childId: string;
  aliasId: string;
  avatarId: string;
  banda: BandaEtaria;
  creadoEn: string;
}

export type ResultadoValidacion = { valido: true } | { valido: false; motivo: string };

export function validarPerfil(seleccion: SeleccionPerfil): ResultadoValidacion {
  if (!ALIAS_CATALOGO.some((a) => a.id === seleccion.aliasId)) {
    return { valido: false, motivo: 'Elige un apodo de la lista.' };
  }
  if (!AVATARES_CATALOGO.some((a) => a.id === seleccion.avatarId)) {
    return { valido: false, motivo: 'Elige un avatar de la lista.' };
  }
  if (!BANDAS.some((b) => b.clave === seleccion.banda)) {
    return { valido: false, motivo: 'Elige un rango de edad.' };
  }
  return { valido: true };
}

/** 16 bytes aleatorios en hex. Sin relacion con la seleccion del usuario. */
function idOpaco(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Crea el perfil. `ahora` se inyecta para mantener la funcion determinista en
 * los tests; en la UI se pasa `new Date().toISOString()`.
 */
export function crearPerfilInfantil(seleccion: SeleccionPerfil, ahora: string): PerfilInfantil {
  return {
    childId: idOpaco(),
    aliasId: seleccion.aliasId,
    avatarId: seleccion.avatarId,
    banda: seleccion.banda,
    creadoEn: ahora,
  };
}

/** Busca la etiqueta legible de un apodo del catalogo. */
export function etiquetaAlias(aliasId: string): string {
  return ALIAS_CATALOGO.find((a) => a.id === aliasId)?.etiqueta ?? '';
}

/** Busca el emoji de un avatar del catalogo. */
export function emojiAvatar(avatarId: string): string {
  return AVATARES_CATALOGO.find((a) => a.id === avatarId)?.emoji ?? '';
}
