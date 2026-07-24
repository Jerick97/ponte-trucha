/**
 * Conversaciones decorativas de la app Mensajes: relleno creible y
 * apropiado para el mundo de un nino (familia y amigos). Solo el hilo del
 * escenario es interactivo; estos dan contexto al simulador.
 */

import mama from '../../../assets/img/avatares/sms-mama.jpg';
import papa from '../../../assets/img/avatares/sms-papa.jpg';
import abuela from '../../../assets/img/avatares/sms-abuela.jpg';
import tia from '../../../assets/img/avatares/sms-tia.jpg';
import primo from '../../../assets/img/avatares/sms-leo.jpg';

export interface SmsMock {
  id: string;
  nombre: string;
  vistaPrevia: string;
  hora: string;
  /** Ruta local del retrato; si falta, va el avatar gris del sistema. */
  avatar?: string;
  sinLeer?: boolean;
}

export const SMS_MOCK: SmsMock[] = [
  { id: 'mama', nombre: 'Mamá ❤️', vistaPrevia: '¿Ya saliste del cole? Avísame para recogerte', hora: '9:15 a. m.', avatar: mama, sinLeer: true },
  { id: 'papa', nombre: 'Papá', vistaPrevia: 'Te espero en la puerta 👍', hora: '8:52 a. m.', avatar: papa },
  { id: 'abuela', nombre: 'Abuela Rosa', vistaPrevia: 'Feliz día mi niño, te mando bendiciones 🙏', hora: 'Ayer', avatar: abuela },
  { id: 'leo', nombre: 'Leo', vistaPrevia: '¡gané la carrera! te toca la revancha', hora: 'Ayer', avatar: primo },
  { id: 'tia', nombre: 'Tía Caro', vistaPrevia: 'Archivo adjunto: 1 imagen', hora: 'Domingo', avatar: tia },
];
