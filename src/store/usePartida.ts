/**
 * Estado global de la partida (zustand).
 *
 * El backend es la fuente de verdad: elige el reto, califica el intento y
 * guarda el progreso (R3, R4, R5 de `backend-serverless`). Este store no tiene
 * banco de escenarios ni calcula puntos; solo orquesta fases, acumula la
 * partida en curso con lo que respondio el servidor y traduce errores a algo
 * que un niño pueda leer.
 *
 * El reto llega en dos tiempos, a proposito: primero lo visible y, recien
 * despues del intento, la revelacion con señales y leccion.
 */

import { create } from 'zustand';
import type { Escenario, Veredicto } from '../types/escenario';
import { RONDAS_POR_PARTIDA, crearPartida, type EstadoPartida } from '../game/motor';
import { calcularNivel, type NivelTrucha } from '../game/nivelTrucha';
import { calcularMedallas, type Medalla } from '../game/medallas';
import { guardarSiEsMejor } from './record';
import {
  ErrorApi,
  MENSAJE_SIN_BACKEND,
  apiHabilitada,
  bucketDeTiempo,
  clienteApi,
  escenarioRevelado,
  escenarioVisible,
  partidaConRondaRemota,
  rondaDesdeResultado,
  veredictoHaciaApi,
  type RetoApi,
} from '../api';
import { conversacionConsentida, useSesion, type EstadoRemoto } from './sesion';
import type { TurnoChat } from '../llm';

export type FaseJuego = 'inicio' | 'mensaje' | 'feedback' | 'chat' | 'resultado';

/** Cuantos turnos puede durar la conversacion con el estafador. */
export const MAX_TURNOS_CHAT = 4;

/** Mensajes de error en lenguaje de niño: nada de codigos ni jerga tecnica. */
const MENSAJES_ERROR: Record<string, string> = {
  CHALLENGE_ALREADY_ANSWERED: 'Ese mensaje ya lo respondiste. Vamos con el siguiente.',
  CHALLENGE_EXPIRED: 'Este mensaje ya caducó. Pide el siguiente.',
  CONSENT_REQUIRED: 'Falta un permiso del adulto para seguir.',
  NETWORK_ERROR: 'Se cortó la conexión. Intenta otra vez.',
  PROFILE_NOT_FOUND: 'No encontramos el perfil. Vuelve a entrar.',
};

function mensajeDeJuego(error: unknown): string {
  if (error instanceof ErrorApi) {
    return MENSAJES_ERROR[error.codigo] ?? 'El servidor no pudo responder. Intenta otra vez.';
  }
  return 'Algo salió mal. Intenta otra vez.';
}

interface EstadoStore {
  fase: FaseJuego;
  /** Escenarios ya mostrados en esta partida, en orden. */
  ronda: Escenario[];
  indice: number;
  /** Rondas que dura la partida. La decide el cliente; el contenido, el servidor. */
  totalRondas: number;
  partida: EstadoPartida;
  ultimaRespuesta: Veredicto | null;
  chat: TurnoChat[];
  chatCargando: boolean;
  /** Si la partida recien terminada supero el record guardado. */
  esRecord: boolean;
  estadoReto: EstadoRemoto;
  estadoIntento: EstadoRemoto;
  errorJuego: string | null;

  iniciar: () => Promise<void>;
  responderEscenario: (respuesta: Veredicto) => Promise<void>;
  siguiente: () => Promise<void>;
  abrirChat: () => void;
  enviarMensajeAlEstafador: (texto: string) => Promise<void>;
  reiniciar: () => void;

  escenarioActual: () => Escenario | null;
  nivelFinal: () => NivelTrucha;
  medallasFinales: () => Medalla[];
}

const INICIAL = {
  fase: 'inicio' as FaseJuego,
  ronda: [] as Escenario[],
  indice: 0,
  totalRondas: RONDAS_POR_PARTIDA,
  ultimaRespuesta: null,
  chat: [] as TurnoChat[],
  chatCargando: false,
  esRecord: false,
  estadoReto: 'idle' as EstadoRemoto,
  estadoIntento: 'idle' as EstadoRemoto,
  errorJuego: null,
};

/** Reto vigente y el momento en que se mostro, para el rango de tiempo. */
let retoVigente: RetoApi | null = null;
let mostradoEn = 0;

export const usePartida = create<EstadoStore>((set, get) => {
  /** Cierra la partida guardando el record del dispositivo. */
  function terminar(): void {
    const esRecord = guardarSiEsMejor(get().partida, calcularNivel(get().partida));
    set({ fase: 'resultado', esRecord, estadoReto: 'success' });
  }

  /**
   * Pide el siguiente reto al backend. Si el banco se queda sin candidatos
   * elegibles, la partida termina donde va en vez de dejar al niño esperando.
   */
  async function pedirReto(indice: number): Promise<void> {
    const perfil = useSesion.getState().perfil;
    if (!apiHabilitada() || perfil === null) {
      set({ estadoReto: 'error', errorJuego: MENSAJE_SIN_BACKEND });
      return;
    }

    set({ estadoReto: 'loading', errorJuego: null });
    try {
      const reto = await clienteApi().siguienteReto(perfil.childId);
      retoVigente = reto;
      mostradoEn = Date.now();
      const escenario = escenarioVisible(reto);
      set((estado) => ({
        ronda: [...estado.ronda.slice(0, indice), escenario],
        indice,
        fase: 'mensaje',
        ultimaRespuesta: null,
        chat: [],
        estadoReto: 'success',
      }));
    } catch (error) {
      if (error instanceof ErrorApi && error.codigo === 'NO_ELIGIBLE_SCENARIO') {
        if (get().partida.resultados.length > 0) {
          terminar();
          return;
        }
        set({ estadoReto: 'error', errorJuego: 'Por ahora no hay mensajes nuevos para ti.' });
        return;
      }
      set({ estadoReto: 'error', errorJuego: mensajeDeJuego(error) });
    }
  }

  return {
    ...INICIAL,
    partida: crearPartida(),

    iniciar: async () => {
      retoVigente = null;
      set({ ...INICIAL, partida: crearPartida() });
      await pedirReto(0);
    },

    responderEscenario: async (respuesta) => {
      const visible = get().escenarioActual();
      const reto = retoVigente;
      if (visible === null || reto === null || get().estadoIntento === 'loading') return;

      set({ estadoIntento: 'loading', errorJuego: null });
      try {
        // El tiempo sale del navegador como rango, nunca como milisegundos.
        const resultado = await clienteApi().enviarIntento({
          challengeId: reto.challengeId,
          decision: veredictoHaciaApi(respuesta),
          bucket: bucketDeTiempo(Date.now() - mostradoEn),
        });

        const revelado = escenarioRevelado(visible, resultado);
        const { indice, ronda, partida } = get();
        set({
          ronda: ronda.map((escenario, posicion) =>
            posicion === indice
              ? // La conversacion solo se ofrece si el adulto la autorizo.
                { ...revelado, permiteConversacion: revelado.permiteConversacion && conversacionConsentida() }
              : escenario,
          ),
          partida: partidaConRondaRemota(partida, rondaDesdeResultado(respuesta, resultado)),
          ultimaRespuesta: respuesta,
          fase: 'feedback',
          estadoIntento: 'success',
        });
      } catch (error) {
        set({ estadoIntento: 'error', errorJuego: mensajeDeJuego(error) });
      }
    },

    siguiente: async () => {
      const { indice, totalRondas } = get();
      const siguienteIndice = indice + 1;
      if (siguienteIndice >= totalRondas) {
        terminar();
        return;
      }
      await pedirReto(siguienteIndice);
    },

    abrirChat: () => set({ fase: 'chat' }),

    enviarMensajeAlEstafador: async (texto) => {
      const reto = retoVigente;
      if (reto === null || get().chatCargando) return;

      // El texto del niño es efimero: se manda para esta respuesta y no se guarda.
      const historial: TurnoChat[] = [...get().chat, { autor: 'nino', texto }];
      set({ chat: historial, chatCargando: true, errorJuego: null });
      try {
        const respuesta = await clienteApi().responderEstafador({
          challengeId: reto.challengeId,
          historial,
        });
        set({
          chat: [...historial, { autor: 'estafador', texto: respuesta.texto }],
          chatCargando: false,
        });
      } catch (error) {
        set({ chatCargando: false, errorJuego: mensajeDeJuego(error) });
      }
    },

    reiniciar: () => {
      retoVigente = null;
      set({ ...INICIAL, partida: crearPartida() });
    },

    escenarioActual: () => {
      const { ronda, indice } = get();
      return ronda[indice] ?? null;
    },

    nivelFinal: () => calcularNivel(get().partida),

    medallasFinales: () => calcularMedallas(get().partida, get().ronda),
  };
});
