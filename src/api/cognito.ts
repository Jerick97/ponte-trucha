/**
 * Cliente minimo de Cognito para la cuenta del adulto.
 *
 * Habla directo con la API JSON de `cognito-idp` (`X-Amz-Target`), sin SDK ni
 * dependencias nuevas. Solo usa operaciones que no requieren firma SigV4 ni
 * client secret, porque el app client de la SPA es publico:
 *
 * - `SignUp` / `ConfirmSignUp`: crear la cuenta y confirmarla con el codigo que
 *   Cognito manda al correo del adulto;
 * - `InitiateAuth` (`USER_PASSWORD_AUTH`): iniciar sesion y obtener el access
 *   token que valida API Gateway;
 * - `RevokeToken`: cortar el refresh token al cerrar sesion.
 *
 * Lo que este modulo NO hace:
 * - guardar la contrasena: se usa para la peticion y se descarta;
 * - persistir tokens: eso vive en `src/api/token.ts`, en memoria;
 * - registrar al niño: Cognito solo conoce al adulto (`seguridad-infantil.md`).
 *
 * Nota de despliegue: ADR-002 define Hosted UI + Authorization Code + PKCE para
 * AWS real, que ademas es lo unico que emite scopes de resource server. El
 * emulador local no implementa `/oauth2/authorize`, asi que en local se usa
 * `USER_PASSWORD_AUTH` sobre HTTPS/localhost y el backend recibe los scopes por
 * configuracion del ambiente emulado.
 */

const PREFIJO_TARGET = 'AWSCognitoIdentityProviderService';
const TIMEOUT_MS = 10_000;

/** Error de Cognito con su `__type` (por ejemplo `NotAuthorizedException`). */
export class ErrorCognito extends Error {
  constructor(
    readonly codigo: string,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ErrorCognito';
  }
}

export interface SesionCognito {
  tokenAcceso: string;
  /** Segundos de vida del token, tal como los declara Cognito. */
  expiraEn: number;
  /**
   * Refresh token, solo presente al iniciar sesion. Cognito no lo reemite al
   * renovar. Quien lo reciba decide si lo persiste (`src/api/sesionGuardada.ts`).
   */
  refreshToken: string | null;
}

export interface ResultadoRegistro {
  /** `true` si Cognito no pide confirmacion por correo. */
  confirmado: boolean;
  /** Destino ofuscado del codigo, para poder decirle al adulto donde buscarlo. */
  destino: string | null;
}

export interface ConfiguracionClienteCognito {
  baseUrl: string;
  clientId: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

interface RespuestaAuth {
  AuthenticationResult?: { AccessToken?: string; ExpiresIn?: number; RefreshToken?: string };
  ChallengeName?: string;
}

interface RespuestaSignUp {
  UserConfirmed?: boolean;
  CodeDeliveryDetails?: { Destination?: string };
}

interface RespuestaGetUser {
  Username?: string;
  UserAttributes?: { Name: string; Value: string }[];
}

interface RespuestaError {
  __type?: string;
  message?: string;
  Message?: string;
}

/** Mensajes para el adulto: claros, sin filtrar detalles internos de Cognito. */
const MENSAJES: Record<string, string> = {
  CodeMismatchException: 'Ese código no coincide. Revisa el correo y vuelve a intentarlo.',
  ExpiredCodeException: 'El código ya venció. Pide uno nuevo.',
  InvalidPasswordException:
    'La contraseña no cumple los requisitos: 12 caracteres con mayúscula, minúscula, número y símbolo.',
  NotAuthorizedException: 'Correo o contraseña incorrectos.',
  RED: 'No pudimos contactar al servidor de cuentas.',
  UserNotConfirmedException: 'Falta confirmar la cuenta con el código que enviamos al correo.',
  UsernameExistsException: 'Ya existe una cuenta con ese correo. Entra con tu contraseña.',
  UserNotFoundException: 'Correo o contraseña incorrectos.',
};

export function mensajeDeCognito(codigo: string): string {
  return MENSAJES[codigo] ?? 'No pudimos completar la operación. Inténtalo de nuevo.';
}

function tipoDeError(datos: unknown): string {
  if (typeof datos !== 'object' || datos === null) return 'UnknownError';
  const problema = datos as RespuestaError;
  const tipo = problema.__type ?? '';
  // Cognito devuelve `com.amazon.coral.service#TipoDelError`.
  return tipo.includes('#') ? (tipo.split('#').pop() ?? tipo) : tipo || 'UnknownError';
}

export class ClienteCognito {
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(config: ConfiguracionClienteCognito) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '') || '/';
    this.clientId = config.clientId;
    this.fetchImpl = config.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.timeoutMs = config.timeoutMs ?? TIMEOUT_MS;
  }

  private async llamar<T>(accion: string, cuerpo: Record<string, unknown>): Promise<T> {
    let respuesta: Response;
    try {
      respuesta = await this.fetchImpl(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': `${PREFIJO_TARGET}.${accion}`,
        },
        body: JSON.stringify(cuerpo),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      throw new ErrorCognito('RED', mensajeDeCognito('RED'));
    }

    const texto = await respuesta.text();
    const datos: unknown = texto ? JSON.parse(texto) : null;
    if (!respuesta.ok) {
      const codigo = tipoDeError(datos);
      throw new ErrorCognito(codigo, mensajeDeCognito(codigo));
    }
    return datos as T;
  }

  /** Crea la cuenta del adulto. La contrasena no se guarda en ninguna parte. */
  async registrar(entrada: { correo: string; clave: string }): Promise<ResultadoRegistro> {
    const datos = await this.llamar<RespuestaSignUp>('SignUp', {
      ClientId: this.clientId,
      Username: entrada.correo,
      Password: entrada.clave,
      UserAttributes: [{ Name: 'email', Value: entrada.correo }],
    });
    return {
      confirmado: datos.UserConfirmed === true,
      destino: datos.CodeDeliveryDetails?.Destination ?? null,
    };
  }

  /** Confirma la cuenta con el codigo que Cognito envio al correo del adulto. */
  async confirmarRegistro(entrada: { correo: string; codigo: string }): Promise<void> {
    await this.llamar('ConfirmSignUp', {
      ClientId: this.clientId,
      Username: entrada.correo,
      ConfirmationCode: entrada.codigo,
    });
  }

  /** Pide otro codigo de confirmacion. */
  async reenviarCodigo(correo: string): Promise<void> {
    await this.llamar('ResendConfirmationCode', {
      ClientId: this.clientId,
      Username: correo,
    });
  }

  /** Inicia sesion y devuelve el access token que validara API Gateway. */
  async iniciarSesion(entrada: { correo: string; clave: string }): Promise<SesionCognito> {
    const datos = await this.llamar<RespuestaAuth>('InitiateAuth', {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: this.clientId,
      AuthParameters: { USERNAME: entrada.correo, PASSWORD: entrada.clave },
    });

    return this.sesionDe(datos);
  }

  /** Renueva el access token con el refresh token de una sesion anterior. */
  async renovarSesion(refreshToken: string): Promise<SesionCognito> {
    const datos = await this.llamar<RespuestaAuth>('InitiateAuth', {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: this.clientId,
      AuthParameters: { REFRESH_TOKEN: refreshToken },
    });
    return this.sesionDe(datos);
  }

  /** Correo del adulto autenticado, para mostrarlo en el area de padres. */
  async correoDelAdulto(tokenAcceso: string): Promise<string | null> {
    const datos = await this.llamar<RespuestaGetUser>('GetUser', { AccessToken: tokenAcceso });
    const atributos = datos.UserAttributes ?? [];
    return atributos.find((atributo) => atributo.Name === 'email')?.Value ?? datos.Username ?? null;
  }

  /**
   * Cierra sesion revocando el refresh token, para que el valor guardado no
   * sirva mas. Si la revocacion falla, no se bloquea la salida: el token local
   * ya se descarto.
   */
  async cerrarSesion(refreshToken: string | null): Promise<void> {
    if (refreshToken === null) return;
    try {
      await this.llamar('RevokeToken', { ClientId: this.clientId, Token: refreshToken });
    } catch {
      // Cerrar sesion nunca puede fallar para el adulto.
    }
  }

  private sesionDe(datos: RespuestaAuth): SesionCognito {
    const resultado = datos.AuthenticationResult;
    if (!resultado?.AccessToken) {
      // Un desafio pendiente (MFA, cambio de clave) no esta soportado todavia.
      throw new ErrorCognito(
        datos.ChallengeName ?? 'SinTokenException',
        'Esta cuenta necesita un paso extra que todavía no soportamos.',
      );
    }
    return {
      tokenAcceso: resultado.AccessToken,
      expiraEn: resultado.ExpiresIn ?? 0,
      refreshToken: resultado.RefreshToken ?? null,
    };
  }
}
