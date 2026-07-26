/**
 * Configuracion publica del backend y de Cognito.
 *
 * Nada de esto es secreto: son la URL del API, el id del User Pool y el id del
 * app client publico (`generate_secret = false`). El secreto de firma vive en
 * el backend y el access token nunca sale de la memoria del navegador.
 *
 * En local, `scripts/entorno-floci.sh` genera `.env.local` desde los outputs de
 * Terraform y el dev server hace de proxy (`/api` y `/cognito`), porque el
 * emulador no responde con headers CORS.
 *
 * Las funciones leen `import.meta.env` en cada llamada a proposito: asi un test
 * puede cambiar el entorno sin reimportar el modulo.
 */

/** Base del API `/v1`, sin barra final. Vacia si no hay backend configurado. */
export function baseUrlApi(): string {
  return (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
}

/** `true` si el juego tiene a donde hablar. Sin esto no hay partida. */
export function apiHabilitada(): boolean {
  return baseUrlApi().length > 0;
}

export interface ConfiguracionCognito {
  /** Endpoint de `cognito-idp`, sin barra final. */
  baseUrl: string;
  /** App client publico de la SPA. */
  clientId: string;
}

export interface ConfiguracionOAuth {
  /** Dominio de Cognito Hosted UI, sin barra final. */
  baseUrl: string;
  /** App client publico de la SPA. */
  clientId: string;
  /** URL exacta registrada como callback en Cognito. */
  redirectUri: string;
}

/** Configuracion de Cognito, o `null` si falta algun dato. */
export function configuracionCognito(): ConfiguracionCognito | null {
  const baseUrl = (import.meta.env.VITE_COGNITO_URL ?? '').replace(/\/$/, '');
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID ?? '';
  if (!baseUrl || !clientId) return null;
  return { baseUrl, clientId };
}

/** `true` si el adulto puede iniciar sesion de verdad. */
export function cognitoHabilitado(): boolean {
  return configuracionCognito() !== null;
}

/** Configuracion de Authorization Code + PKCE para AWS real. */
export function configuracionOAuth(): ConfiguracionOAuth | null {
  const baseUrl = (import.meta.env.VITE_COGNITO_OAUTH_URL ?? '').replace(/\/$/, '');
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID ?? '';
  const redirectUri = import.meta.env.VITE_COGNITO_REDIRECT_URI ?? '';
  if (!baseUrl || !clientId || !redirectUri) return null;
  return { baseUrl, clientId, redirectUri };
}

/** En local queda apagado porque Floci no implementa Hosted UI. */
export function oauthHabilitado(): boolean {
  return configuracionOAuth() !== null;
}

/** Mensaje unico para cuando falta configuracion; evita textos sueltos en la UI. */
export const MENSAJE_SIN_BACKEND =
  'Falta configurar el backend. Genera .env.local con scripts/entorno-floci.sh y reinicia el servidor.';
