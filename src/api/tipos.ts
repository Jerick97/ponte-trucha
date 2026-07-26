/**
 * Contratos del API `/v1`, escritos a mano y validados contra el OpenAPI que
 * genera FastAPI (`npm run validar:api`).
 *
 * Regla: esto refleja lo que el backend devuelve, NO lo que la UI necesita. La
 * traduccion a los tipos del juego vive en `src/api/mapeo.ts`.
 *
 * JSON en camelCase, fechas UTC en RFC 3339 con sufijo Z, ids opacos.
 */

/** Finalidades de consentimiento del adulto. Coinciden con `ClaveFinalidad`. */
export type FinalidadApi = 'core' | 'serverSideAi' | 'productAnalytics';

export type EstadoConsentimientoApi = 'granted' | 'denied' | 'revoked';

export type DecisionConsentimientoApi = 'grant' | 'deny' | 'revoke';

/** Banda etaria del perfil infantil. */
export type BandaEtariaApi = '8-10' | '11-13';

/** Canal/app del reto tal como lo nombra el backend. */
export type AppTypeApi = 'whatsapp' | 'sms' | 'email' | 'roblox' | 'discord';

/** La decision del niño y la respuesta correcta usan el mismo vocabulario. */
export type VeredictoApi = 'trap' | 'legitimate';

/** Rango de tiempo de respuesta: el backend nunca recibe milisegundos exactos. */
export type BucketTiempoApi = 'under-10s' | '10-30s' | 'over-30s' | 'unknown';

export interface CuentaApi {
  status: string;
  ageGateRuleVersion: string;
  profileCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConsentimientoApi {
  purpose: FinalidadApi;
  state: EstadoConsentimientoApi;
  policyVersion: string;
  decidedAt: string;
  revokedAt: string | null;
}

export interface PerfilApi {
  childId: string;
  aliasId: string;
  avatarId: string;
  ageBand: BandaEtariaApi;
  createdAt: string;
  updatedAt: string;
}

export interface RemitenteApi {
  nombre: string;
  avatar: string;
  verificado: boolean;
}

/**
 * Contenido visible del reto. No trae tipo, señales, leccion, perfil del
 * estafador ni si permite conversar: todo eso llega recien con el resultado.
 */
export interface PayloadRetoApi {
  canal: string;
  dificultad: number;
  remitente: RemitenteApi;
  mensaje: string;
  asunto?: string;
}

export interface RetoApi {
  challengeId: string;
  appType: AppTypeApi;
  difficulty: number;
  payload: PayloadRetoApi;
  validUntil: string;
}

export interface SenalApi {
  fragment: string;
  explanation: string;
}

export interface PerfilEstafadorApi {
  disguise: string;
  tactics: string[];
  objective: string;
}

/** Resultado del intento: puntaje autoritativo + revelacion educativa. */
export interface ResultadoIntentoApi {
  attemptId: string;
  challengeId: string;
  isCorrect: boolean;
  pointsAwarded: number;
  score: number;
  streak: number;
  totalAttempts: number;
  correctAttempts: number;
  currentDifficulty: number;
  signalCodes: string[];
  feedbackCode: string;
  correctDecision: VeredictoApi;
  scenarioType: string;
  signals: SenalApi[];
  lesson: string;
  allowsConversation: boolean;
  scammerProfile: PerfilEstafadorApi | null;
}

export interface ProgresoApi {
  score: number;
  streak: number;
  totalAttempts: number;
  correctAttempts: number;
  currentDifficulty: number;
}

export interface CanalApi {
  appType: AppTypeApi;
  displayName: string;
  iconKey: string;
}

export interface TurnoApi {
  autor: 'nino' | 'estafador';
  texto: string;
}

export interface RespuestaEstafadorApi {
  texto: string;
  origen: 'curated';
  filtrada: boolean;
}

/** Cuerpo de error segun RFC 9457 (`application/problem+json`). */
export interface ProblemaApi {
  type: string;
  title: string;
  status: number;
  detail: string;
  code: string;
  errors?: { field: string; code: string }[];
}
