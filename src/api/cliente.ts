/**
 * Cliente HTTP del API `/v1`. Es la unica parte del frontend que conoce rutas,
 * headers y codigos de error del backend.
 *
 * Decisiones que respeta:
 * - el access token viaja en `Authorization: Bearer` y vive en memoria; nunca
 *   en `localStorage` ni en la URL (ADR-002);
 * - toda mutacion sensible manda `Idempotency-Key`, asi un reintento no
 *   duplica puntos ni borra dos veces;
 * - los errores llegan como `problem+json` y se traducen a `ErrorApi` con su
 *   `codigo`, para que la UI decida el mensaje sin leer HTTP crudo;
 * - el niño nunca envia milisegundos: el tiempo de respuesta se agrupa en
 *   rangos antes de salir del navegador.
 */

import type {
  BandaEtariaApi,
  BucketTiempoApi,
  CanalApi,
  ConsentimientoApi,
  CuentaApi,
  DecisionConsentimientoApi,
  FinalidadApi,
  PerfilApi,
  ProblemaApi,
  ProgresoApi,
  RespuestaEstafadorApi,
  ResultadoIntentoApi,
  RetoApi,
  TurnoApi,
  VeredictoApi,
} from './tipos';

/** Timeout por peticion: el juego no puede quedarse colgado esperando. */
const TIMEOUT_MS = 8000;

export const RUTAS = {
  apps: '/v1/apps',
  consentimiento: (finalidad: FinalidadApi) => `/v1/consentimientos/${finalidad}`,
  consentimientos: '/v1/consentimientos',
  cuenta: '/v1/cuenta',
  intentos: (challengeId: string) => `/v1/retos/${challengeId}/intentos`,
  me: '/v1/me',
  perfil: (childId: string) => `/v1/perfiles/${childId}`,
  perfiles: '/v1/perfiles',
  progreso: (childId: string) => `/v1/perfiles/${childId}/progreso`,
  respuestasEstafador: '/v1/conversaciones/respuestas',
  siguienteReto: (childId: string) => `/v1/perfiles/${childId}/retos/siguiente`,
} as const;

/** Error de API con el codigo estable del backend (`CONSENT_REQUIRED`, etc.). */
export class ErrorApi extends Error {
  constructor(
    readonly codigo: string,
    readonly status: number,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }

  /** `true` si reintentar tiene sentido (red caida o error del servidor). */
  get esTransitorio(): boolean {
    return this.status === 0 || this.status === 429 || this.status >= 500;
  }
}

export interface ConfiguracionApi {
  baseUrl: string;
  /** Devuelve el access token vigente, o `null` si no hay sesion. */
  obtenerToken: () => string | null;
  /** Inyectable para probar sin red. */
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

interface OpcionesPeticion {
  metodo?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  cuerpo?: unknown;
  idempotencia?: boolean;
}

/** Agrupa el tiempo de respuesta en rangos antes de enviarlo. */
export function bucketDeTiempo(milisegundos: number): BucketTiempoApi {
  if (!Number.isFinite(milisegundos) || milisegundos < 0) return 'unknown';
  if (milisegundos < 10_000) return 'under-10s';
  if (milisegundos <= 30_000) return '10-30s';
  return 'over-30s';
}

/** Clave de idempotencia nueva por intento del usuario. */
export function nuevaClaveIdempotencia(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function esProblema(valor: unknown): valor is ProblemaApi {
  return typeof valor === 'object' && valor !== null && 'code' in valor;
}

export class ClienteApi {
  private readonly baseUrl: string;
  private readonly obtenerToken: () => string | null;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(config: ConfiguracionApi) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.obtenerToken = config.obtenerToken;
    this.fetchImpl = config.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.timeoutMs = config.timeoutMs ?? TIMEOUT_MS;
  }

  private async pedir<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
    const { metodo = 'GET', cuerpo, idempotencia = false } = opciones;
    const headers: Record<string, string> = {};
    const token = this.obtenerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
    if (idempotencia) headers['Idempotency-Key'] = nuevaClaveIdempotencia();

    let respuesta: Response;
    try {
      respuesta = await this.fetchImpl(`${this.baseUrl}${ruta}`, {
        method: metodo,
        headers,
        body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      throw new ErrorApi('NETWORK_ERROR', 0, 'No se pudo contactar al servidor.');
    }

    if (respuesta.status === 204) return undefined as T;

    const texto = await respuesta.text();
    const datos: unknown = texto ? JSON.parse(texto) : null;

    if (!respuesta.ok) {
      const codigo = esProblema(datos) ? datos.code : 'HTTP_ERROR';
      const titulo = esProblema(datos) ? datos.title : 'Error del servidor';
      throw new ErrorApi(codigo, respuesta.status, titulo);
    }
    return datos as T;
  }

  // --- Cuenta y consentimiento (adulto) --------------------------------
  crearCuenta(ageGateRuleVersion: string): Promise<CuentaApi> {
    return this.pedir<CuentaApi>(RUTAS.cuenta, {
      metodo: 'POST',
      cuerpo: { ageGateRuleVersion },
    });
  }

  obtenerCuenta(): Promise<CuentaApi> {
    return this.pedir<CuentaApi>(RUTAS.me);
  }

  borrarCuenta(): Promise<void> {
    return this.pedir<void>(RUTAS.me, { metodo: 'DELETE', idempotencia: true });
  }

  listarConsentimientos(): Promise<ConsentimientoApi[]> {
    return this.pedir<ConsentimientoApi[]>(RUTAS.consentimientos);
  }

  decidirConsentimiento(entrada: {
    finalidad: FinalidadApi;
    decision: DecisionConsentimientoApi;
    versionPolitica: string;
    metodo: string;
  }): Promise<ConsentimientoApi> {
    return this.pedir<ConsentimientoApi>(RUTAS.consentimiento(entrada.finalidad), {
      metodo: 'PATCH',
      cuerpo: {
        decision: entrada.decision,
        policyVersion: entrada.versionPolitica,
        method: entrada.metodo,
      },
      idempotencia: true,
    });
  }

  // --- Perfiles infantiles ---------------------------------------------
  crearPerfil(entrada: {
    aliasId: string;
    avatarId: string;
    banda: BandaEtariaApi;
  }): Promise<PerfilApi> {
    return this.pedir<PerfilApi>(RUTAS.perfiles, {
      metodo: 'POST',
      cuerpo: { aliasId: entrada.aliasId, avatarId: entrada.avatarId, ageBand: entrada.banda },
    });
  }

  listarPerfiles(): Promise<PerfilApi[]> {
    return this.pedir<PerfilApi[]>(RUTAS.perfiles);
  }

  borrarPerfil(childId: string): Promise<void> {
    return this.pedir<void>(RUTAS.perfil(childId), { metodo: 'DELETE', idempotencia: true });
  }

  // --- Loop del juego ---------------------------------------------------
  siguienteReto(childId: string): Promise<RetoApi> {
    return this.pedir<RetoApi>(RUTAS.siguienteReto(childId));
  }

  enviarIntento(entrada: {
    challengeId: string;
    decision: VeredictoApi;
    bucket: BucketTiempoApi;
  }): Promise<ResultadoIntentoApi> {
    return this.pedir<ResultadoIntentoApi>(RUTAS.intentos(entrada.challengeId), {
      metodo: 'POST',
      cuerpo: { decision: entrada.decision, responseTimeBucket: entrada.bucket },
      idempotencia: true,
    });
  }

  obtenerProgreso(childId: string): Promise<ProgresoApi> {
    return this.pedir<ProgresoApi>(RUTAS.progreso(childId));
  }

  listarApps(): Promise<CanalApi[]> {
    return this.pedir<CanalApi[]>(RUTAS.apps);
  }

  /** Chat con el personaje. El texto del niño es efimero: no se persiste. */
  responderEstafador(entrada: {
    challengeId: string;
    historial: readonly TurnoApi[];
  }): Promise<RespuestaEstafadorApi> {
    return this.pedir<RespuestaEstafadorApi>(RUTAS.respuestasEstafador, {
      metodo: 'POST',
      cuerpo: { challengeId: entrada.challengeId, historial: entrada.historial },
    });
  }
}
