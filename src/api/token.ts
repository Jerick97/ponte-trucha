/**
 * Access token del adulto, EN MEMORIA y en un solo lugar.
 *
 * Reglas que aplica (ADR-002, `estandares-de-codigo.md`):
 * - nunca toca `localStorage`, `sessionStorage`, cookies ni la URL;
 * - vive en una variable de modulo, asi que recargar la pagina cierra la sesion;
 * - el cliente del API lo lee al momento de cada peticion, para no capturar un
 *   token viejo.
 */

let token: string | null = null;

/** Guarda el token recien emitido, o `null` al cerrar sesion. */
export function guardarToken(nuevo: string | null): void {
  token = nuevo;
}

/** Token vigente, o `null` si no hay sesion. */
export function tokenVigente(): string | null {
  return token;
}
