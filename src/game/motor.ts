/**
 * Motor del juego: logica pura, sin React, sin DOM, sin red.
 *
 * Regla dura: nada en este archivo importa React ni toca window.
 * Asi el motor se puede testear con vitest sin montar la UI.
 */

import type { Escenario, Veredicto } from '../types/escenario';

/** Cuantos escenarios entran en una partida. */
export const RONDAS_POR_PARTIDA = 8;

/** Puntos base por acertar. */
export const PUNTOS_ACIERTO = 100;

/** Bonus por cada acierto consecutivo, acumulable hasta MAX_BONUS_RACHA. */
export const BONUS_POR_RACHA = 25;
export const MAX_BONUS_RACHA = 100;

/** Resultado de evaluar una respuesta del nino. */
export interface ResultadoRonda {
  escenarioId: string;
  respuesta: Veredicto;
  acerto: boolean;
  puntosGanados: number;
  rachaDespues: number;
}

/** Estado acumulado de la partida. */
export interface EstadoPartida {
  puntaje: number;
  racha: number;
  mejorRacha: number;
  aciertos: number;
  fallos: number;
  resultados: ResultadoRonda[];
}

/** Estado inicial, siempre limpio. */
export function crearPartida(): EstadoPartida {
  return {
    puntaje: 0,
    racha: 0,
    mejorRacha: 0,
    aciertos: 0,
    fallos: 0,
    resultados: [],
  };
}

/**
 * Baraja determinista: recibe una funcion aleatoria inyectable
 * para que los tests puedan fijar el resultado.
 */
export function barajar<T>(items: readonly T[], aleatorio: () => number = Math.random): T[] {
  const copia = [...items];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Arma la lista de escenarios de una partida.
 *
 * Reglas de contenido acordadas con el brief:
 * - Se mezclan estafas con mensajes legitimos (nunca solo estafas:
 *   el objetivo es que distingan, no que desconfien de todo).
 * - Se ordena por dificultad ascendente para que el arranque sea facil.
 */
export function armarRonda(
  banco: readonly Escenario[],
  totalRondas: number = RONDAS_POR_PARTIDA,
  aleatorio: () => number = Math.random,
): Escenario[] {
  const legitimos = banco.filter((e) => e.tipo === 'legitimo');
  const estafas = banco.filter((e) => e.tipo !== 'legitimo');

  // Aproximadamente un tercio de mensajes legitimos, minimo uno.
  const cuotaLegitimos = Math.max(1, Math.round(totalRondas / 3));

  const elegidos = [
    ...barajar(legitimos, aleatorio).slice(0, cuotaLegitimos),
    ...barajar(estafas, aleatorio).slice(0, totalRondas - cuotaLegitimos),
  ];

  return barajar(elegidos, aleatorio).sort((a, b) => a.dificultad - b.dificultad);
}

/** Puntos de una respuesta correcta segun la racha previa. */
export function calcularPuntos(rachaPrevia: number): number {
  const bonus = Math.min(rachaPrevia * BONUS_POR_RACHA, MAX_BONUS_RACHA);
  return PUNTOS_ACIERTO + bonus;
}

/**
 * Evalua una respuesta y devuelve el nuevo estado.
 * No muta el estado recibido: devuelve uno nuevo.
 */
export function responder(
  estado: EstadoPartida,
  escenario: Escenario,
  respuesta: Veredicto,
): EstadoPartida {
  const acerto = respuesta === escenario.respuestaCorrecta;
  const puntosGanados = acerto ? calcularPuntos(estado.racha) : 0;
  const racha = acerto ? estado.racha + 1 : 0;

  const resultado: ResultadoRonda = {
    escenarioId: escenario.id,
    respuesta,
    acerto,
    puntosGanados,
    rachaDespues: racha,
  };

  return {
    puntaje: estado.puntaje + puntosGanados,
    racha,
    mejorRacha: Math.max(estado.mejorRacha, racha),
    aciertos: estado.aciertos + (acerto ? 1 : 0),
    fallos: estado.fallos + (acerto ? 0 : 1),
    resultados: [...estado.resultados, resultado],
  };
}
