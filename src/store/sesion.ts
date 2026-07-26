/**
 * Maquina de estados del onboarding adulto. Hace de "router" del proyecto:
 * decide si se ve la landing, el onboarding o el telefono.
 *
 * Aqui no hay simulaciones: el adulto se registra e inicia sesion contra el
 * User Pool de Cognito, y la cuenta, los consentimientos y el perfil infantil
 * se crean con llamadas al API (`/v1/cuenta`, `/v1/consentimientos`,
 * `/v1/perfiles`). El servidor manda; este store solo orquesta pasos y estados.
 *
 * Privacidad (`seguridad-infantil.md`, `estandares-de-codigo.md`):
 * - el access token vive en memoria (`src/api/token.ts`), nunca en storage;
 * - la contrasena se usa para la peticion y se descarta en el componente;
 * - la fecha de nacimiento del adulto no entra al store: solo la prueba del
 *   age gate (version de regla + timestamp);
 * - del perfil infantil solo se guardan alias, avatar, banda y el id opaco que
 *   devolvio el servidor.
 */

import { create } from 'zustand';
import {
  ErrorApi,
  ErrorCognito,
  MENSAJE_SIN_BACKEND,
  apiHabilitada,
  clienteApi,
  clienteCognito,
  guardarRefreshToken,
  guardarToken,
  correoOAuth,
  iniciarOAuth,
  leerRefreshToken,
  oauthHabilitado,
  olvidarRefreshToken,
  procesarRetornoOAuth,
  renovarOAuth,
} from '../api';
import type { ConsentimientoApi, FinalidadApi, PerfilApi } from '../api';
import { VERSION_REGLA_AGE_GATE, type PruebaAgeGate } from '../onboarding/ageGate';
import {
  VERSION_POLITICA,
  consentimientoInicial,
  decidir,
  puedeUsar,
  type ClaveFinalidad,
  type EstadoConsentimiento,
  type MapaConsentimiento,
} from '../onboarding/consentimiento';
import {
  validarPerfil,
  type BandaEtaria,
  type PerfilInfantil,
  type SeleccionPerfil,
} from '../onboarding/perfilInfantil';

export type PasoSesion =
  | 'landing'
  | 'ageGate'
  | 'acceso'
  | 'confirmacion'
  | 'consentimiento'
  | 'perfiles'
  | 'perfil'
  | 'jugando';

/** A donde lleva "volver" desde cada paso. `landing` y `jugando` no vuelven. */
const PASO_ANTERIOR: Partial<Record<PasoSesion, PasoSesion>> = {
  ageGate: 'landing',
  acceso: 'ageGate',
  confirmacion: 'acceso',
  consentimiento: 'acceso',
  perfiles: 'consentimiento',
  perfil: 'perfiles',
};

/** Estados de una operacion remota, como pide el estandar de codigo. */
export type EstadoRemoto = 'idle' | 'loading' | 'success' | 'error';

/** Lo unico que guardamos del adulto: su correo, para mostrarlo en el area de padres. */
export interface AdultoEnSesion {
  correo: string;
}

const ESTADO_POR_API: Record<ConsentimientoApi['state'], EstadoConsentimiento> = {
  granted: 'otorgado',
  denied: 'denegado',
  revoked: 'revocado',
};

/** Traduce un perfil del API al modelo del onboarding. */
export function perfilDesdeApi(perfil: PerfilApi): PerfilInfantil {
  return {
    childId: perfil.childId,
    aliasId: perfil.aliasId,
    avatarId: perfil.avatarId,
    banda: perfil.ageBand as BandaEtaria,
    creadoEn: perfil.createdAt,
  };
}

/** Traduce lo que devolvio el servidor al mapa que usa la UI. */
export function consentimientoDesdeApi(registros: readonly ConsentimientoApi[]): MapaConsentimiento {
  const mapa = consentimientoInicial();
  for (const registro of registros) {
    mapa[registro.purpose as ClaveFinalidad] = {
      estado: ESTADO_POR_API[registro.state],
      versionPolitica: registro.policyVersion,
      decididoEn: registro.decidedAt,
      ...(registro.revokedAt === null ? {} : { revocadoEn: registro.revokedAt }),
    };
  }
  return mapa;
}

/**
 * Decide a donde ir cuando ya se conoce el consentimiento y los perfiles.
 *
 * Sin `core` vigente hay que volver a preguntar; con perfiles existentes se
 * elige uno (asi el progreso no queda huerfano); sin perfiles, se crea el
 * primero.
 */
function pasoTrasConsentimiento(
  consentimiento: MapaConsentimiento,
  perfiles: readonly PerfilInfantil[],
): PasoSesion {
  if (!puedeUsar(consentimiento, 'core')) return 'consentimiento';
  return perfiles.length > 0 ? 'perfiles' : 'perfil';
}

function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorCognito) return error.message;
  if (error instanceof ErrorApi) {
    if (error.codigo === 'CONSENT_REQUIRED') return 'Falta activar el permiso necesario.';
    if (error.esTransitorio) return 'No pudimos contactar al servidor. Intenta otra vez.';
    return 'El servidor rechazó la operación.';
  }
  return 'Algo salió mal. Intenta otra vez.';
}

interface EstadoSesion {
  paso: PasoSesion;
  pruebaAgeGate: PruebaAgeGate | null;
  adulto: AdultoEnSesion | null;
  estadoAcceso: EstadoRemoto;
  errorAcceso: string | null;
  /** Aviso neutro del paso de acceso (por ejemplo, "cuenta confirmada"). */
  avisoAcceso: string | null;
  /** Correo a la espera del codigo de confirmacion de Cognito. */
  correoPorConfirmar: string | null;
  consentimiento: MapaConsentimiento;
  estadoConsentimiento: EstadoRemoto;
  errorConsentimiento: string | null;
  /** Perfiles infantiles que ya existen en la cuenta. */
  perfiles: PerfilInfantil[];
  perfil: PerfilInfantil | null;
  estadoPerfil: EstadoRemoto;
  errorPerfil: string | null;
  /** `true` mientras se intenta reanudar una sesion guardada. */
  restaurando: boolean;

  restaurar: () => Promise<void>;
  irAAgeGate: () => void;
  aprobarAgeGate: (prueba: PruebaAgeGate) => void;
  irAAcceso: () => void;
  registrar: (correo: string, clave: string) => Promise<void>;
  confirmarCuenta: (codigo: string) => Promise<void>;
  reenviarCodigo: () => Promise<void>;
  acceder: (correo: string, clave: string) => Promise<void>;
  decidirFinalidad: (clave: ClaveFinalidad, otorga: boolean) => void;
  confirmarConsentimiento: () => Promise<void>;
  irACrearPerfil: () => void;
  crearPerfil: (seleccion: SeleccionPerfil) => Promise<void>;
  elegirPerfil: (childId: string) => void;
  borrarPerfil: (childId: string) => Promise<void>;
  empezarAJugar: () => void;
  volver: () => void;
  cerrarSesion: () => void;
}

const INICIAL = {
  paso: 'landing' as PasoSesion,
  pruebaAgeGate: null,
  adulto: null,
  estadoAcceso: 'idle' as EstadoRemoto,
  errorAcceso: null,
  avisoAcceso: null,
  correoPorConfirmar: null,
  estadoConsentimiento: 'idle' as EstadoRemoto,
  errorConsentimiento: null,
  perfiles: [] as PerfilInfantil[],
  perfil: null,
  estadoPerfil: 'idle' as EstadoRemoto,
  errorPerfil: null,
  restaurando: false,
};

export const useSesion = create<EstadoSesion>((set, get) => ({
  ...INICIAL,
  consentimiento: consentimientoInicial(),

  /**
   * Reanuda la sesion del adulto tras una recarga, si hay refresh token
   * guardado. Si algo falla, se olvida la sesion y se vuelve a la landing: es la
   * opcion conservadora en un dispositivo compartido.
   */
  restaurar: async () => {
    // React StrictMode ejecuta el efecto dos veces en desarrollo.
    if (get().restaurando) return;
    const refreshToken = leerRefreshToken();
    const cognito = clienteCognito();
    if (cognito === null || !apiHabilitada()) return;

    set({ restaurando: true });
    try {
      const retorno = await procesarRetornoOAuth();
      if (retorno === null && refreshToken === null) {
        set({ restaurando: false });
        return;
      }

      const sesion =
        retorno?.sesion ??
        (oauthHabilitado()
          ? await renovarOAuth(refreshToken as string)
          : await cognito.renovarSesion(refreshToken as string));
      guardarToken(sesion.tokenAcceso);
      if (sesion.refreshToken !== null) guardarRefreshToken(sesion.refreshToken);

      const api = clienteApi();
      const cuenta =
        retorno === null
          ? await api.obtenerCuenta()
          : await api.crearCuenta(retorno.pruebaAgeGate.versionRegla);
      // Con Hosted UI el correo sale de /oauth2/userInfo: GetUser exige el
      // scope aws.cognito.signin.user.admin, que ese flujo no emite. En ningun
      // caso un fallo al leer el correo debe tumbar la sesion recien creada.
      const correo = oauthHabilitado()
        ? await correoOAuth(sesion.tokenAcceso)
        : await cognito.correoDelAdulto(sesion.tokenAcceso).catch(() => null);
      const consentimiento = consentimientoDesdeApi(await api.listarConsentimientos());
      const perfiles = puedeUsar(consentimiento, 'core')
        ? (await api.listarPerfiles()).map(perfilDesdeApi)
        : [];

      set({
        adulto: { correo: correo ?? '' },
        estadoAcceso: 'success',
        // La prueba del gate la conserva el servidor: version y fecha de la cuenta.
        pruebaAgeGate:
          retorno?.pruebaAgeGate ?? {
            versionRegla: cuenta.ageGateRuleVersion,
            aprobadoEn: cuenta.createdAt,
          },
        consentimiento,
        perfiles,
        paso: pasoTrasConsentimiento(consentimiento, perfiles),
        restaurando: false,
      });
    } catch {
      guardarToken(null);
      olvidarRefreshToken();
      set({ ...INICIAL, consentimiento: consentimientoInicial() });
    }
  },

  irAAgeGate: () => set({ paso: 'ageGate' }),

  aprobarAgeGate: (prueba) => {
    set({ pruebaAgeGate: prueba, paso: 'acceso' });
    if (oauthHabilitado()) {
      set({ estadoAcceso: 'loading', errorAcceso: null });
      void iniciarOAuth(prueba).catch(() => {
        set({
          estadoAcceso: 'error',
          errorAcceso: 'No pudimos abrir el acceso seguro. Intenta otra vez.',
        });
      });
    }
  },

  irAAcceso: () => {
    // Puerta: sin gate aprobado no se muestra el formulario.
    if (!get().pruebaAgeGate) return;
    set({ paso: 'acceso' });
  },

  registrar: async (correo, clave) => {
    // Puerta: el age gate va antes de crear cualquier cuenta (R1).
    const pruebaAgeGate = get().pruebaAgeGate;
    if (!pruebaAgeGate) return;
    // AWS real autentica exclusivamente con Hosted UI: el flujo directo no
    // emite los scopes del resource server que exige API Gateway.
    if (oauthHabilitado()) {
      await iniciarOAuth(pruebaAgeGate);
      return;
    }
    const cognito = clienteCognito();
    if (cognito === null || !apiHabilitada()) {
      set({ estadoAcceso: 'error', errorAcceso: MENSAJE_SIN_BACKEND });
      return;
    }

    set({ estadoAcceso: 'loading', errorAcceso: null, avisoAcceso: null });
    try {
      const resultado = await cognito.registrar({ correo, clave });
      if (!resultado.confirmado) {
        set({
          estadoAcceso: 'idle',
          correoPorConfirmar: correo,
          paso: 'confirmacion',
        });
        return;
      }
    } catch (error) {
      set({ estadoAcceso: 'error', errorAcceso: mensajeDeError(error), adulto: null });
      return;
    }
    await get().acceder(correo, clave);
  },

  confirmarCuenta: async (codigo) => {
    const correo = get().correoPorConfirmar;
    const cognito = clienteCognito();
    if (correo === null || cognito === null) return;

    set({ estadoAcceso: 'loading', errorAcceso: null });
    try {
      await cognito.confirmarRegistro({ correo, codigo });
    } catch (error) {
      set({ estadoAcceso: 'error', errorAcceso: mensajeDeError(error) });
      return;
    }
    // La contrasena ya se descarto, asi que el adulto entra de nuevo a proposito.
    set({
      estadoAcceso: 'idle',
      correoPorConfirmar: null,
      paso: 'acceso',
      avisoAcceso: 'Cuenta confirmada. Entra con tu correo y contraseña.',
    });
  },

  reenviarCodigo: async () => {
    const correo = get().correoPorConfirmar;
    const cognito = clienteCognito();
    if (correo === null || cognito === null) return;
    try {
      await cognito.reenviarCodigo(correo);
      set({ avisoAcceso: 'Te enviamos un código nuevo.', errorAcceso: null });
    } catch (error) {
      set({ errorAcceso: mensajeDeError(error) });
    }
  },

  acceder: async (correo, clave) => {
    // Puerta: el age gate va antes de crear cualquier cuenta (R1).
    const pruebaAgeGate = get().pruebaAgeGate;
    if (!pruebaAgeGate) return;
    if (oauthHabilitado()) {
      await iniciarOAuth(pruebaAgeGate);
      return;
    }
    const cognito = clienteCognito();
    if (cognito === null || !apiHabilitada()) {
      set({ estadoAcceso: 'error', errorAcceso: MENSAJE_SIN_BACKEND });
      return;
    }

    set({ estadoAcceso: 'loading', errorAcceso: null, avisoAcceso: null });
    try {
      const sesion = await cognito.iniciarSesion({ correo, clave });
      guardarToken(sesion.tokenAcceso);
      // Persistir el refresh token permite reanudar la sesion tras recargar.
      if (sesion.refreshToken !== null) guardarRefreshToken(sesion.refreshToken);

      const api = clienteApi();
      // El servidor crea la cuenta si no existe y devuelve su estado real.
      await api.crearCuenta(VERSION_REGLA_AGE_GATE);
      const consentimiento = consentimientoDesdeApi(await api.listarConsentimientos());
      const perfiles = puedeUsar(consentimiento, 'core')
        ? (await api.listarPerfiles()).map(perfilDesdeApi)
        : [];

      set({
        adulto: { correo },
        estadoAcceso: 'success',
        errorAcceso: null,
        consentimiento,
        perfiles,
        paso: pasoTrasConsentimiento(consentimiento, perfiles),
      });
    } catch (error) {
      guardarToken(null);
      olvidarRefreshToken();
      const pendiente = error instanceof ErrorCognito && error.codigo === 'UserNotConfirmedException';
      set({
        estadoAcceso: 'error',
        errorAcceso: mensajeDeError(error),
        adulto: null,
        paso: pendiente ? 'confirmacion' : 'acceso',
        correoPorConfirmar: pendiente ? correo : null,
      });
    }
  },

  decidirFinalidad: (clave, otorga) =>
    // Las decisiones se acumulan en pantalla y se envian juntas al confirmar:
    // asi el adulto puede cambiar de opinion antes de que quede registrado.
    set({
      consentimiento: decidir(get().consentimiento, clave, otorga, new Date().toISOString()),
      errorConsentimiento: null,
    }),

  confirmarConsentimiento: async () => {
    const { consentimiento } = get();
    // Puerta: `core` es indispensable para crear perfiles (R3/R4).
    if (!puedeUsar(consentimiento, 'core')) return;

    set({ estadoConsentimiento: 'loading', errorConsentimiento: null });
    try {
      const api = clienteApi();
      // Una decision por finalidad, versionada: nunca un "acepto todo".
      for (const finalidad of ['core', 'serverSideAi', 'productAnalytics'] as const) {
        await api.decidirConsentimiento({
          finalidad: finalidad as FinalidadApi,
          decision: puedeUsar(consentimiento, finalidad) ? 'grant' : 'deny',
          versionPolitica: VERSION_POLITICA,
          metodo: 'explicit-click',
        });
      }
      const registros = await api.listarConsentimientos();
      const guardado = consentimientoDesdeApi(registros);
      if (!puedeUsar(guardado, 'core')) {
        set({
          estadoConsentimiento: 'error',
          errorConsentimiento: 'El servidor no registró el permiso necesario.',
        });
        return;
      }
      const perfiles = (await api.listarPerfiles()).map(perfilDesdeApi);
      set({
        consentimiento: guardado,
        perfiles,
        estadoConsentimiento: 'success',
        paso: pasoTrasConsentimiento(guardado, perfiles),
      });
    } catch (error) {
      set({ estadoConsentimiento: 'error', errorConsentimiento: mensajeDeError(error) });
    }
  },

  irACrearPerfil: () => {
    if (!puedeUsar(get().consentimiento, 'core')) return;
    set({ paso: 'perfil', errorPerfil: null });
  },

  crearPerfil: async (seleccion) => {
    if (!puedeUsar(get().consentimiento, 'core')) return;
    if (!validarPerfil(seleccion).valido) return;

    set({ estadoPerfil: 'loading', errorPerfil: null });
    try {
      // El `childId` lo genera el servidor: es opaco y no se deriva del alias.
      const perfil = perfilDesdeApi(
        await clienteApi().crearPerfil({
          aliasId: seleccion.aliasId,
          avatarId: seleccion.avatarId,
          banda: seleccion.banda,
        }),
      );
      set({ perfil, perfiles: [...get().perfiles, perfil], estadoPerfil: 'success' });
    } catch (error) {
      set({ estadoPerfil: 'error', errorPerfil: mensajeDeError(error) });
    }
  },

  elegirPerfil: (childId) => {
    const perfil = get().perfiles.find((candidato) => candidato.childId === childId);
    if (perfil === undefined) return;
    set({ perfil, estadoPerfil: 'success', errorPerfil: null });
  },

  borrarPerfil: async (childId) => {
    set({ estadoPerfil: 'loading', errorPerfil: null });
    try {
      await clienteApi().borrarPerfil(childId);
      const perfiles = get().perfiles.filter((perfil) => perfil.childId !== childId);
      const actual = get().perfil;
      set({
        perfiles,
        perfil: actual?.childId === childId ? null : actual,
        estadoPerfil: 'success',
        paso: perfiles.length > 0 ? 'perfiles' : 'perfil',
      });
    } catch (error) {
      set({ estadoPerfil: 'error', errorPerfil: mensajeDeError(error) });
    }
  },

  empezarAJugar: () => {
    // Puerta: no se entra al telefono sin un perfil infantil.
    if (!get().perfil) return;
    set({ paso: 'jugando' });
  },

  volver: () => {
    const anterior = PASO_ANTERIOR[get().paso];
    if (anterior === undefined) return;
    set({ paso: anterior, errorAcceso: null });
  },

  cerrarSesion: () => {
    // Revocar deja inservible el refresh token que estaba guardado en la pestaña.
    const refreshToken = leerRefreshToken();
    guardarToken(null);
    olvidarRefreshToken();
    void clienteCognito()?.cerrarSesion(refreshToken);
    set({ ...INICIAL, consentimiento: consentimientoInicial() });
  },
}));

/** Perfil infantil vigente, para quien necesite el `childId` fuera de React. */
export function perfilVigente(): PerfilInfantil | null {
  return useSesion.getState().perfil;
}

/** `true` si el adulto autorizo la conversacion con IA server-side. */
export function conversacionConsentida(): boolean {
  return puedeUsar(useSesion.getState().consentimiento, 'serverSideAi');
}
