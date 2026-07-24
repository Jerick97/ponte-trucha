/**
 * Medallas de fin de partida: logros que se derivan de los resultados.
 * Logica pura (sin React ni DOM): entran el estado y la ronda jugada, salen
 * las medallas. Se testea en src/test/medallas.test.ts.
 */

import type { EstadoPartida } from './motor';
import type { Escenario } from '../types/escenario';

export interface Medalla {
  clave: 'sin-fallos' | 'racha-fuego' | 'ojo-fino';
  titulo: string;
  emoji: string;
  /** Frase corta en lenguaje de nino. */
  detalle: string;
}

/** Cuantos legitimos hay que acertar (y cuantos deben existir) para "Ojo fino". */
const MIN_LEGITIMOS = 2;
/** Racha minima para la medalla de fuego. */
const RACHA_FUEGO = 5;

export function calcularMedallas(
  partida: EstadoPartida,
  ronda: readonly Escenario[],
): Medalla[] {
  const total = partida.aciertos + partida.fallos;
  if (total === 0) return [];

  const medallas: Medalla[] = [];

  if (partida.fallos === 0) {
    medallas.push({
      clave: 'sin-fallos',
      titulo: 'Sin fallos',
      emoji: '🎯',
      detalle: 'No se te escapó ni una.',
    });
  }

  if (partida.mejorRacha >= RACHA_FUEGO) {
    medallas.push({
      clave: 'racha-fuego',
      titulo: 'Racha de fuego',
      emoji: '🔥',
      detalle: `${partida.mejorRacha} seguidas sin fallar.`,
    });
  }

  // Ojo fino: acerto todos los mensajes legitimos que le tocaron.
  const porId = new Map(ronda.map((e) => [e.id, e]));
  const legitimos = partida.resultados.filter(
    (r) => porId.get(r.escenarioId)?.tipo === 'legitimo',
  );
  if (legitimos.length >= MIN_LEGITIMOS && legitimos.every((r) => r.acerto)) {
    medallas.push({
      clave: 'ojo-fino',
      titulo: 'Ojo fino',
      emoji: '🕵️',
      detalle: 'No confundiste ningún mensaje bueno con trampa.',
    });
  }

  return medallas;
}
