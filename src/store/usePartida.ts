/**
 * Estado global de la partida (zustand).
 *
 * El store solo orquesta: la logica de puntaje vive en src/game/motor.ts
 * y la conversacion en src/llm. Si una regla de juego termina aqui,
 * esta en el archivo equivocado.
 */

import { create } from 'zustand';
import banco from '../data/escenarios.json';
import type { BancoEscenarios, Escenario, Veredicto } from '../types/escenario';
import { armarRonda, crearPartida, responder, type EstadoPartida } from '../game/motor';
import { calcularNivel, type NivelTrucha } from '../game/nivelTrucha';
import { calcularMedallas, type Medalla } from '../game/medallas';
import { guardarSiEsMejor } from './record';
import { obtenerProveedor, type TurnoChat } from '../llm';

const BANCO = banco as BancoEscenarios;

export type FaseJuego = 'inicio' | 'mensaje' | 'feedback' | 'chat' | 'resultado';

interface EstadoStore {
  fase: FaseJuego;
  ronda: Escenario[];
  indice: number;
  partida: EstadoPartida;
  ultimaRespuesta: Veredicto | null;
  chat: TurnoChat[];
  chatCargando: boolean;
  /** Si la partida recien terminada supero el record guardado. */
  esRecord: boolean;

  iniciar: () => void;
  responderEscenario: (respuesta: Veredicto) => void;
  siguiente: () => void;
  abrirChat: () => void;
  enviarMensajeAlEstafador: (texto: string) => Promise<void>;
  reiniciar: () => void;

  escenarioActual: () => Escenario | null;
  nivelFinal: () => NivelTrucha;
  medallasFinales: () => Medalla[];
}

/** Cuantos turnos puede durar la conversacion con el estafador. */
export const MAX_TURNOS_CHAT = 4;

export const usePartida = create<EstadoStore>((set, get) => ({
  fase: 'inicio',
  ronda: [],
  indice: 0,
  partida: crearPartida(),
  ultimaRespuesta: null,
  chat: [],
  chatCargando: false,
  esRecord: false,

  iniciar: () => {
    set({
      fase: 'mensaje',
      ronda: armarRonda(BANCO.escenarios),
      indice: 0,
      partida: crearPartida(),
      ultimaRespuesta: null,
      chat: [],
      esRecord: false,
    });
  },

  responderEscenario: (respuesta) => {
    const escenario = get().escenarioActual();
    if (!escenario) return;
    set({
      partida: responder(get().partida, escenario, respuesta),
      ultimaRespuesta: respuesta,
      fase: 'feedback',
    });
  },

  siguiente: () => {
    const { indice, ronda, partida } = get();
    const siguienteIndice = indice + 1;
    if (siguienteIndice >= ronda.length) {
      // Fin de la partida: persiste el record en el dispositivo (localStorage).
      const esRecord = guardarSiEsMejor(partida, calcularNivel(partida));
      set({ fase: 'resultado', esRecord });
      return;
    }
    set({ indice: siguienteIndice, fase: 'mensaje', ultimaRespuesta: null, chat: [] });
  },

  abrirChat: () => set({ fase: 'chat' }),

  enviarMensajeAlEstafador: async (texto) => {
    const escenario = get().escenarioActual();
    if (!escenario || get().chatCargando) return;

    const historial: TurnoChat[] = [...get().chat, { autor: 'nino', texto }];
    set({ chat: historial, chatCargando: true });

    const proveedor = await obtenerProveedor();
    const respuesta = await proveedor.responder({ escenario, historial });

    set({
      chat: [...historial, { autor: 'estafador', texto: respuesta.texto }],
      chatCargando: false,
    });
  },

  reiniciar: () =>
    set({ fase: 'inicio', ronda: [], indice: 0, partida: crearPartida(), chat: [], esRecord: false }),

  escenarioActual: () => {
    const { ronda, indice } = get();
    return ronda[indice] ?? null;
  },

  nivelFinal: () => calcularNivel(get().partida),

  medallasFinales: () => calcularMedallas(get().partida, get().ronda),
}));
