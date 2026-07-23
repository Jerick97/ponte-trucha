/**
 * Relleno decorativo de Discord: servidores, canales y mensajes directos
 * creibles y apropiados para el mundo de un nino (juegos, colegio, primos).
 * Solo el DM del escenario es interactivo; el resto da contexto.
 */

import primo from '../../../assets/img/avatares/primo.jpg';

/** Identidad del nino dentro del simulador (misma en todas las apps). */
export const JUGADOR = {
  nombre: 'SuperTrucha',
  usuario: 'supertrucha',
  avatar: '🐟',
} as const;

export interface ServidorMock {
  id: string;
  nombre: string;
  /** Emoji que pinta el circulo del rail (los servidores reales usan su logo). */
  emoji: string;
  noLeidos?: number;
}

export const SERVIDORES_MOCK: ServidorMock[] = [
  { id: 'club', nombre: 'Club de Juegos', emoji: '🎮', noLeidos: 1 },
  { id: 'aula', nombre: 'Aula 6B', emoji: '📚', noLeidos: 4 },
  { id: 'pixel', nombre: 'Pixel Art', emoji: '🎨' },
  { id: 'musica', nombre: 'Beats', emoji: '🎵', noLeidos: 2 },
  { id: 'lego', nombre: 'Bloques', emoji: '🧱' },
];

export interface CanalMock {
  id: string;
  nombre: string;
  /** Canal de voz (altavoz) en vez de texto (#). */
  esVoz?: boolean;
  noLeidos?: number;
}

export interface CategoriaMock {
  nombre: string;
  canales: CanalMock[];
}

/** Canales del servidor activo (Club de Juegos). */
export const CATEGORIAS_MOCK: CategoriaMock[] = [
  {
    nombre: '👋 BIENVENIDA',
    canales: [
      { id: 'anuncios', nombre: '📣-anuncios' },
      { id: 'reglas', nombre: '📋-reglas-del-club' },
      { id: 'presentate', nombre: '🙋-preséntate' },
    ],
  },
  {
    nombre: '🎮 JUEGOS',
    canales: [
      { id: 'chat-general', nombre: '☕-chat-general', noLeidos: 1 },
      { id: 'trucos', nombre: '💡-trucos-y-guías' },
      { id: 'memes', nombre: '😂-memes' },
      { id: 'off-topic', nombre: '🎲-off-topic' },
    ],
  },
];

export interface DmMock {
  id: string;
  nombre: string;
  vistaPrevia: string;
  hora: string;
  /** Ruta de imagen local o emoji. */
  avatar?: string;
  enLinea?: boolean;
}

export const DMS_MOCK: DmMock[] = [
  { id: 'leo', nombre: 'Leo', vistaPrevia: 'Leo: ¡gané la carrera! 🏁', hora: '2 min', avatar: primo, enLinea: true },
  { id: 'escuadron', nombre: 'Escuadrón Pixel', vistaPrevia: 'Val: mañana jugamos a las 5', hora: '1 h', avatar: '🕹️' },
  { id: 'mariana', nombre: 'Mariana', vistaPrevia: 'Tú: gracias!! 😄', hora: 'Ayer', avatar: '🦄', enLinea: true },
  { id: 'tomas', nombre: 'Tomás', vistaPrevia: 'Tomás: ¿viste el mapa nuevo?', hora: '3 d', avatar: '🐱' },
  { id: 'bot', nombre: 'BotAyudante', vistaPrevia: 'BotAyudante: /ayuda', hora: '1 sem', avatar: '🤖' },
];
