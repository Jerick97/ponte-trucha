/**
 * Chats decorativos de la lista de WhatsApp: relleno creible y apropiado
 * para el mundo de un nino (familia y amigos). Solo el chat del escenario
 * es interactivo; estos dan contexto al simulador.
 *
 * Los retratos son de randomuser.me descargados al repo: en runtime no se
 * llama a ningun servicio externo (regla de seguridad infantil).
 */

import mama from '../../../assets/img/avatares/mama.jpg';
import papa from '../../../assets/img/avatares/papa.jpg';
import abuela from '../../../assets/img/avatares/abuela.jpg';
import tia from '../../../assets/img/avatares/tia.jpg';
import primo from '../../../assets/img/avatares/primo.jpg';

export interface ChatMock {
  id: string;
  nombre: string;
  vistaPrevia: string;
  hora: string;
  /** Ruta local del retrato; si falta y esGrupo, va el avatar de grupo. */
  avatar?: string;
  esGrupo?: boolean;
  noLeidos?: number;
  /** El preview lleva icono de camara ("Foto") o de microfono ("Audio"). */
  tipoAdjunto?: 'foto' | 'audio';
}

export const CHATS_MOCK: ChatMock[] = [
  { id: 'mama', nombre: 'Mamá ❤️', vistaPrevia: '¿Ya hiciste la tarea?', hora: '9:15', avatar: mama, noLeidos: 2 },
  { id: 'papa', nombre: 'Papá', vistaPrevia: 'Nos vemos a la salida 👍', hora: '8:52', avatar: papa },
  { id: 'primos', nombre: 'Primos 🎮', vistaPrevia: 'Leo: ¡gané la carrera!', hora: 'Ayer', avatar: primo, esGrupo: true, noLeidos: 5 },
  { id: 'abuela', nombre: 'Abuela Rosa', vistaPrevia: 'Audio (0:32)', hora: 'Ayer', avatar: abuela, tipoAdjunto: 'audio' },
  { id: 'tia', nombre: 'Tía Caro', vistaPrevia: 'Foto', hora: 'Ayer', avatar: tia, tipoAdjunto: 'foto' },
];
