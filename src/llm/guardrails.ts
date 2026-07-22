/**
 * Segunda linea de defensa: filtra la salida del modelo antes de mostrarla.
 *
 * El prompt es la primera linea; este archivo asume que el prompt puede fallar.
 * Si algo cae aqui, se reemplaza por una linea de guion segura y se marca
 * la respuesta como filtrada (visible en modo debug).
 */

import { MAX_PALABRAS_RESPUESTA } from './prompts';

/** Temas que jamas deben aparecer en el chat del estafador. */
const TERMINOS_PROHIBIDOS: readonly string[] = [
  'direccion de tu casa',
  'donde vives',
  'tu colegio',
  'foto tuya',
  'selfie',
  'camara',
  'video llamada',
  'videollamada',
  'nos vemos',
  'vernos',
  'en persona',
  'novia',
  'novio',
  'secreto entre',
  'no le digas a tus papas',
  'no le cuentes a nadie',
];

/** Frases seguras que reemplazan una respuesta bloqueada. */
const GUION_SEGURO: readonly string[] = [
  'Ya pues, apurate que se acaba la promo.',
  'Confia, a otros ya les mande el premio.',
  'Solo necesito ese dato y listo, nada mas.',
  'Si no lo haces ahora se lo doy a otro.',
];

export interface ResultadoFiltro {
  texto: string;
  filtrada: boolean;
}

/** Recorta a un maximo de palabras sin cortar a media palabra. */
export function recortarPalabras(texto: string, maximo: number = MAX_PALABRAS_RESPUESTA): string {
  const palabras = texto.trim().split(/\s+/);
  if (palabras.length <= maximo) return texto.trim();
  return `${palabras.slice(0, maximo).join(' ')}...`;
}

/**
 * Aplica el filtro de seguridad infantil.
 * indice se usa para variar la frase de reemplazo sin depender de Math.random.
 */
export function filtrarRespuesta(textoCrudo: string, indice: number = 0): ResultadoFiltro {
  const limpio = textoCrudo
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .replace(/^(estafador|tu|yo)\s*:\s*/i, '')
    .trim();

  const normalizado = limpio
    .toLowerCase()
    .normalize('NFD')
    // Quita tildes para que el filtro no dependa de la ortografia del modelo.
    .replace(/[̀-ͯ]/g, '');

  const vacio = limpio.length === 0;
  const contieneProhibido = TERMINOS_PROHIBIDOS.some((t) => normalizado.includes(t));

  if (vacio || contieneProhibido) {
    return { texto: GUION_SEGURO[indice % GUION_SEGURO.length], filtrada: true };
  }

  return { texto: recortarPalabras(limpio), filtrada: false };
}
