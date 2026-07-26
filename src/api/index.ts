/**
 * Punto de entrada del cliente del API. El resto del frontend importa desde
 * aqui, nunca de los archivos internos.
 *
 * Los clientes son perezosos y compartidos: se crean la primera vez que alguien
 * los pide, leyendo la configuracion del entorno en ese momento. `reiniciarClientes()`
 * existe para que las pruebas cambien el entorno entre casos.
 */

import { ClienteApi } from './cliente';
import { ClienteCognito } from './cognito';
import { baseUrlApi, configuracionCognito } from './config';
import { tokenVigente } from './token';

export { ClienteApi, ErrorApi, RUTAS, bucketDeTiempo, nuevaClaveIdempotencia } from './cliente';
export { ClienteCognito, ErrorCognito, mensajeDeCognito } from './cognito';
export type { SesionCognito } from './cognito';
export {
  MENSAJE_SIN_BACKEND,
  apiHabilitada,
  baseUrlApi,
  cognitoHabilitado,
  configuracionCognito,
  configuracionOAuth,
  oauthHabilitado,
} from './config';
export { correoOAuth, iniciarOAuth, procesarRetornoOAuth, renovarOAuth } from './oauth';
export { guardarToken, tokenVigente } from './token';
export {
  guardarRefreshToken,
  leerRefreshToken,
  olvidarRefreshToken,
} from './sesionGuardada';
export {
  canalDelReto,
  escenarioRevelado,
  escenarioVisible,
  partidaConRondaRemota,
  rondaDesdeResultado,
  veredictoDesdeApi,
  veredictoHaciaApi,
} from './mapeo';
export type * from './tipos';

let clienteApiActual: ClienteApi | null = null;
let clienteCognitoActual: ClienteCognito | null = null;

/** Cliente del API `/v1`. Lee el token vigente en cada peticion. */
export function clienteApi(): ClienteApi {
  clienteApiActual ??= new ClienteApi({
    baseUrl: baseUrlApi(),
    obtenerToken: tokenVigente,
  });
  return clienteApiActual;
}

/** Cliente de Cognito, o `null` si el entorno no lo configuro. */
export function clienteCognito(): ClienteCognito | null {
  if (clienteCognitoActual === null) {
    const config = configuracionCognito();
    if (config === null) return null;
    clienteCognitoActual = new ClienteCognito(config);
  }
  return clienteCognitoActual;
}

/** Olvida los clientes creados. Solo lo usan las pruebas. */
export function reiniciarClientes(): void {
  clienteApiActual = null;
  clienteCognitoActual = null;
}
