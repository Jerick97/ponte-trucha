/**
 * Authorization Code + PKCE para Cognito Hosted UI.
 *
 * El verifier, state y la prueba del age gate viven solo en sessionStorage
 * durante el salto a Cognito. No se guarda la fecha de nacimiento ni se usa un
 * client secret en la SPA.
 */

import type { PruebaAgeGate } from '../onboarding/ageGate';
import { configuracionOAuth } from './config';
import type { SesionCognito } from './cognito';

const CLAVE_PKCE = 'ptk.oauth.pkce';
const SCOPES = [
  'openid',
  'email',
  'ponte-trucha-api/account.delete',
  'ponte-trucha-api/consents.read',
  'ponte-trucha-api/consents.write',
  'ponte-trucha-api/game.play',
  'ponte-trucha-api/profiles.read',
  'ponte-trucha-api/profiles.write',
].join(' ');

interface EstadoPkce {
  verifier: string;
  state: string;
  pruebaAgeGate: PruebaAgeGate;
}

interface RespuestaToken {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
}

function base64Url(bytes: Uint8Array): string {
  let binario = '';
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function aleatorio(longitud = 32): string {
  const bytes = new Uint8Array(longitud);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

async function sha256(texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(texto);
  return base64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)));
}

function limpiarRetornoOAuth(): void {
  const url = new URL(window.location.href);
  for (const clave of ['code', 'state', 'error', 'error_description']) {
    url.searchParams.delete(clave);
  }
  history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}

async function intercambiar(cuerpo: URLSearchParams): Promise<SesionCognito> {
  const config = configuracionOAuth();
  if (config === null) throw new Error('OAuth no configurado.');

  const respuesta = await fetch(`${config.baseUrl}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: cuerpo,
  });
  const datos = (await respuesta.json()) as RespuestaToken;
  if (!respuesta.ok || !datos.access_token) {
    throw new Error('Cognito no pudo completar el inicio de sesión.');
  }
  return {
    tokenAcceso: datos.access_token,
    expiraEn: datos.expires_in ?? 0,
    refreshToken: datos.refresh_token ?? null,
  };
}

/** Sale de la SPA hacia la pantalla segura de Cognito. */
export async function iniciarOAuth(pruebaAgeGate: PruebaAgeGate): Promise<void> {
  const config = configuracionOAuth();
  if (config === null) return;

  const verifier = aleatorio(64);
  const state = aleatorio();
  const estado: EstadoPkce = { verifier, state, pruebaAgeGate };
  sessionStorage.setItem(CLAVE_PKCE, JSON.stringify(estado));

  const parametros = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: SCOPES,
    state,
    code_challenge_method: 'S256',
    code_challenge: await sha256(verifier),
  });
  window.location.assign(`${config.baseUrl}/oauth2/authorize?${parametros}`);
}

/** Procesa una vuelta de Cognito; devuelve null cuando la carga no es callback. */
export async function procesarRetornoOAuth(): Promise<{
  sesion: SesionCognito;
  pruebaAgeGate: PruebaAgeGate;
} | null> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  if (code === null && error === null) return null;

  const guardado = sessionStorage.getItem(CLAVE_PKCE);
  sessionStorage.removeItem(CLAVE_PKCE);
  limpiarRetornoOAuth();
  if (error !== null || code === null || state === null || guardado === null) {
    throw new Error('No pudimos validar el regreso desde Cognito.');
  }

  const estado = JSON.parse(guardado) as EstadoPkce;
  if (estado.state !== state) throw new Error('La respuesta de Cognito no coincide con esta sesión.');

  const config = configuracionOAuth();
  if (config === null) throw new Error('OAuth no configurado.');
  const sesion = await intercambiar(
    new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      code,
      code_verifier: estado.verifier,
    }),
  );
  return { sesion, pruebaAgeGate: estado.pruebaAgeGate };
}

/**
 * Correo del adulto vía `/oauth2/userInfo`. Los tokens de Hosted UI no tienen
 * el scope `aws.cognito.signin.user.admin` que exige `GetUser`, pero userInfo
 * funciona con `openid` + `email`, que ya se piden. Devuelve `null` en vez de
 * lanzar: quedarse sin correo no debe costar la sesión.
 */
export async function correoOAuth(tokenAcceso: string): Promise<string | null> {
  const config = configuracionOAuth();
  if (config === null) return null;
  try {
    const respuesta = await fetch(`${config.baseUrl}/oauth2/userInfo`, {
      headers: { Authorization: `Bearer ${tokenAcceso}` },
    });
    if (!respuesta.ok) return null;
    const datos = (await respuesta.json()) as { email?: string; username?: string };
    return datos.email ?? datos.username ?? null;
  } catch {
    return null;
  }
}

/** Renueva una sesión emitida por Hosted UI sin client secret. */
export async function renovarOAuth(refreshToken: string): Promise<SesionCognito> {
  const config = configuracionOAuth();
  if (config === null) throw new Error('OAuth no configurado.');
  return intercambiar(
    new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.clientId,
      refresh_token: refreshToken,
    }),
  );
}
