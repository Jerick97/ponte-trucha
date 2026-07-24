/**
 * Identidad ficticia del jugador y amigos decorativos de la app Roblox.
 * Los avatares son los renders clasicos de Roblox que paso Jerick; el del
 * jugador es siempre el default 2017 (como en la app real recien creada).
 */

import avatarJugador from '../../../assets/img/roblox/avatares/2017DefaultMan.webp';
import avatarNoob from '../../../assets/img/roblox/avatares/NewNoob2020.webp';
import avatarMujerDefault from '../../../assets/img/roblox/avatares/2017DefaultWoman.webp';
import avatarChicaGenerica from '../../../assets/img/roblox/avatares/GenericGirl1.webp';
import avatarCasey from '../../../assets/img/roblox/avatares/Casey_2016.webp';
import avatarClaire from '../../../assets/img/roblox/avatares/Claire_2016.webp';
import avatarJohn from '../../../assets/img/roblox/avatares/John_Packages.webp';
import avatarLin from '../../../assets/img/roblox/avatares/LinR6Package.webp';
import avatarOakley from '../../../assets/img/roblox/avatares/OakleyR6Package.webp';
import avatarSerena from '../../../assets/img/roblox/avatares/SerenaR6Package.webp';

export const JUGADOR_RB = {
  nombre: 'SuperTrucha',
  usuario: 'supertrucha',
  avatar: avatarJugador,
};

export interface AmigoRb {
  id: string;
  nombre: string;
  avatar: string;
  enLinea: boolean;
  /** Ultima linea del chat, para la vista Equipo. */
  vistaPrevia: string;
  hora: string;
}

export const AMIGOS_RB: AmigoRb[] = [
  { id: 'mateo', nombre: 'Mateo_Craft', avatar: avatarJohn, enLinea: true, vistaPrevia: '¿Jugamos Brookhaven?', hora: '2 h' },
  { id: 'luna', nombre: 'Luna_Bloxie', avatar: avatarClaire, enLinea: true, vistaPrevia: 'jajaja viste mi casa nueva', hora: '2 h' },
  { id: 'dany', nombre: 'PixelDany', avatar: avatarCasey, enLinea: false, vistaPrevia: 'mañana sigo, me llama mi mamá', hora: '5 h' },
  { id: 'sofi', nombre: 'Sofi_Star', avatar: avatarSerena, enLinea: true, vistaPrevia: 'gané la carrera 🏁', hora: '8 h' },
  { id: 'kevin', nombre: 'KevinGamer2013', avatar: avatarOakley, enLinea: false, vistaPrevia: 'ok nos vemos', hora: '1 d' },
  { id: 'rous', nombre: 'Rous', avatar: avatarLin, enLinea: false, vistaPrevia: 'k bye', hora: '1 d' },
];

/** Avatares posibles para remitentes del escenario (no amigos). */
const AVATARES_REMITENTE = [avatarNoob, avatarMujerDefault, avatarChicaGenerica, avatarJugador];

/**
 * Elige un avatar determinista para el remitente del escenario: el banco
 * trae emojis, pero en Roblox todo el mundo tiene un render de avatar.
 */
export function avatarRemitente(nombre: string): string {
  let suma = 0;
  for (const letra of nombre) suma += letra.codePointAt(0) ?? 0;
  return AVATARES_REMITENTE[suma % AVATARES_REMITENTE.length];
}
