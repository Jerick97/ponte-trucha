/**
 * Maquina de estados del onboarding adulto. Hace de "router" del proyecto:
 * decide si se ve la landing, el onboarding o el telefono.
 *
 * Todo vive EN MEMORIA a proposito. Nada de correo, consentimiento, prueba del
 * age gate ni tokens toca `localStorage` (`estandares-de-codigo.md`). Al
 * recargar la pagina se vuelve a la landing, y eso es correcto: no queremos
 * una sesion infantil persistida en un dispositivo compartido.
 *
 * MOCK: hoy no existe Cognito (`backend/` no esta implementado). `autenticar`
 * simula el resultado de un login exitoso para que el flujo sea recorrible.
 * El punto de conexion real es la tarea 9 de
 * `.kiro/specs/autenticacion-consentimiento-parental/tasks.md` (owner: Francis).
 */

import { create } from 'zustand';
import type { PruebaAgeGate } from '../onboarding/ageGate';
import {
  consentimientoInicial,
  decidir,
  puedeUsar,
  type ClaveFinalidad,
  type MapaConsentimiento,
} from '../onboarding/consentimiento';
import {
  crearPerfilInfantil,
  validarPerfil,
  type PerfilInfantil,
  type SeleccionPerfil,
} from '../onboarding/perfilInfantil';

export type PasoSesion = 'landing' | 'ageGate' | 'acceso' | 'consentimiento' | 'perfil' | 'jugando';

/** Orden canonico del flujo: "volver" es siempre el paso previo de esta lista. */
const ORDEN_PASOS: readonly PasoSesion[] = [
  'landing',
  'ageGate',
  'acceso',
  'consentimiento',
  'perfil',
  'jugando',
];

/** Estados de una operacion remota, como pide el estandar de codigo. */
export type EstadoRemoto = 'idle' | 'loading' | 'success' | 'error';

/**
 * Lo unico que guardamos del adulto: su correo, para mostrarlo en el area de
 * padres. El `sub` y los tokens seran responsabilidad del backend.
 */
export interface AdultoEnSesion {
  correo: string;
}

interface EstadoSesion {
  paso: PasoSesion;
  pruebaAgeGate: PruebaAgeGate | null;
  adulto: AdultoEnSesion | null;
  estadoAcceso: EstadoRemoto;
  errorAcceso: string | null;
  consentimiento: MapaConsentimiento;
  perfil: PerfilInfantil | null;

  irAAgeGate: () => void;
  aprobarAgeGate: (prueba: PruebaAgeGate) => void;
  irAAcceso: () => void;
  empezarAcceso: () => void;
  autenticar: (correo: string) => void;
  fallarAcceso: (mensaje: string) => void;
  decidirFinalidad: (clave: ClaveFinalidad, otorga: boolean) => void;
  confirmarConsentimiento: () => void;
  crearPerfil: (seleccion: SeleccionPerfil) => void;
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
  perfil: null,
};

function ahora(): string {
  return new Date().toISOString();
}

export const useSesion = create<EstadoSesion>((set, get) => ({
  ...INICIAL,
  consentimiento: consentimientoInicial(),

  irAAgeGate: () => set({ paso: 'ageGate' }),

  aprobarAgeGate: (prueba) => set({ pruebaAgeGate: prueba, paso: 'acceso' }),

  irAAcceso: () => {
    // Puerta: sin gate aprobado no se muestra el formulario.
    if (!get().pruebaAgeGate) return;
    set({ paso: 'acceso' });
  },

  empezarAcceso: () => set({ estadoAcceso: 'loading', errorAcceso: null }),

  autenticar: (correo) => {
    // Puerta: el age gate va antes de crear cualquier cuenta (R1).
    if (!get().pruebaAgeGate) return;
    set({
      adulto: { correo },
      estadoAcceso: 'success',
      errorAcceso: null,
      paso: 'consentimiento',
    });
  },

  fallarAcceso: (mensaje) =>
    set({ estadoAcceso: 'error', errorAcceso: mensaje, adulto: null, paso: 'acceso' }),

  decidirFinalidad: (clave, otorga) =>
    set({ consentimiento: decidir(get().consentimiento, clave, otorga, ahora()) }),

  confirmarConsentimiento: () => {
    // Puerta: `core` es indispensable para crear perfiles (R3/R4).
    if (!puedeUsar(get().consentimiento, 'core')) return;
    set({ paso: 'perfil' });
  },

  crearPerfil: (seleccion) => {
    if (!puedeUsar(get().consentimiento, 'core')) return;
    if (!validarPerfil(seleccion).valido) return;
    set({ perfil: crearPerfilInfantil(seleccion, ahora()) });
  },

  empezarAJugar: () => {
    // Puerta: no se entra al telefono sin un perfil infantil.
    if (!get().perfil) return;
    set({ paso: 'jugando' });
  },

  volver: () => {
    const actual = get().paso;
    // Desde el juego no se "vuelve" al onboarding, y desde la landing no hay
    // mas atras. En el resto, atras es SIEMPRE el paso previo del orden
    // canonico: funciona las veces que haga falta, no una sola.
    if (actual === 'landing' || actual === 'jugando') return;
    const indice = ORDEN_PASOS.indexOf(actual);
    set({ paso: ORDEN_PASOS[indice - 1] });
  },

  cerrarSesion: () => set({ ...INICIAL, consentimiento: consentimientoInicial() }),
}));
