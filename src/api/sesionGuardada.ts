/**
 * Persistencia de la sesion del adulto entre recargas.
 *
 * ## Que se guarda y donde
 *
 * Solo el **refresh token** de Cognito, y en `sessionStorage`. El access token
 * sigue viviendo en memoria (`src/api/token.ts`): nunca se persiste.
 *
 * ## Por que `sessionStorage` y no `localStorage`
 *
 * `localStorage` esta prohibido por `estandares-de-codigo.md`: no expira, se
 * comparte entre pestañas y deja la credencial en el dispositivo hasta que
 * alguien limpie el navegador. `sessionStorage` muere al cerrar la pestaña, asi
 * que el token no sobrevive a "cerrar el navegador" en un equipo compartido.
 *
 * ## Deuda conocida, decidida a proposito
 *
 * `sessionStorage` sigue siendo legible por JavaScript, asi que un XSS o una
 * dependencia comprometida podria leer el refresh token. La forma correcta es
 * una cookie `HttpOnly; Secure; SameSite=Strict` emitida por el backend (patron
 * BFF), que exige un endpoint nuevo y que CloudFront sirva el API en el mismo
 * origen. Se aceptó esta version para el MVP y la migracion queda registrada en
 * ADR-002 y en la spec de autenticacion.
 *
 * Mitigaciones vigentes: el access token no se persiste, la salida del area de
 * juego pide el codigo del adulto, y `cerrarSesion` revoca el refresh token en
 * Cognito para que el valor guardado no sirva mas.
 */

const CLAVE = 'ptk.sesion.refresh';

function almacen(): Storage | null {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    // Un navegador con almacenamiento bloqueado no debe romper el juego.
    return null;
  }
}

/** Guarda el refresh token para poder reanudar la sesion tras una recarga. */
export function guardarRefreshToken(token: string): void {
  almacen()?.setItem(CLAVE, token);
}

/** Refresh token guardado, o `null` si no hay sesion que reanudar. */
export function leerRefreshToken(): string | null {
  return almacen()?.getItem(CLAVE) ?? null;
}

/** Olvida la sesion guardada. Se llama al cerrar sesion y al fallar la renovacion. */
export function olvidarRefreshToken(): void {
  almacen()?.removeItem(CLAVE);
}
