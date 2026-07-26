/// <reference types="vite/client" />

/** Variables de entorno publicas del frontend. Aqui NUNCA va un secreto. */
interface ImportMetaEnv {
  /** URL de la Lambda de fallback del estafador (demo legado). */
  readonly VITE_LLM_ENDPOINT?: string;
  /**
   * Base del API `/v1`. En local es `/api`, servido por el proxy del dev server
   * hacia API Gateway. Vacia = no hay backend y el juego no puede arrancar.
   */
  readonly VITE_API_BASE_URL?: string;
  /** Endpoint de `cognito-idp`. En local es `/cognito` (proxy del dev server). */
  readonly VITE_COGNITO_URL?: string;
  /** App client publico de la SPA (`generate_secret = false`). No es un secreto. */
  readonly VITE_COGNITO_CLIENT_ID?: string;
  /** User Pool de cuentas adultas. Informativo para depurar. */
  readonly VITE_COGNITO_USER_POOL_ID?: string;
  /** Dominio de Cognito Hosted UI para Authorization Code + PKCE. */
  readonly VITE_COGNITO_OAUTH_URL?: string;
  /** URL exacta de retorno registrada en el app client. */
  readonly VITE_COGNITO_REDIRECT_URI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
