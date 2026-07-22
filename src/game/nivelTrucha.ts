/**
 * "Nivel de trucha": el resultado final, divertido y compartible.
 * Es la pantalla que el nino manda a sus amigos, asi que el copy importa
 * tanto como el calculo. El texto lo mantiene Contenido (Clau).
 */

import type { EstadoPartida } from './motor';

export interface NivelTrucha {
  /** Clave estable, util para assets y analitica. */
  clave: 'novato' | 'despierto' | 'trucha' | 'super-trucha';
  titulo: string;
  emoji: string;
  /** Frase corta para compartir. */
  frase: string;
  /** Color de acento en CSS custom property. */
  color: string;
}

const NIVELES: readonly NivelTrucha[] = [
  {
    clave: 'novato',
    titulo: 'Novato',
    emoji: '🌱',
    frase: 'Ya empezaste a fijarte. Juega otra vez y vas a ver la diferencia.',
    color: 'var(--color-nivel-novato)',
  },
  {
    clave: 'despierto',
    titulo: 'Ojo despierto',
    emoji: '👀',
    frase: 'Cachaste varias trampas. Todavia se te escapa alguna.',
    color: 'var(--color-nivel-despierto)',
  },
  {
    clave: 'trucha',
    titulo: 'Trucha',
    emoji: '🐟',
    frase: 'Dificil meterte el dedo a la boca. Sigue asi.',
    color: 'var(--color-nivel-trucha)',
  },
  {
    clave: 'super-trucha',
    titulo: 'Super trucha',
    emoji: '🏆',
    frase: 'Nadie te estafa. Ahora ensenale a un amigo.',
    color: 'var(--color-nivel-super)',
  },
];

/** Porcentaje de aciertos de la partida (0 a 100). */
export function porcentajeAciertos(estado: EstadoPartida): number {
  const total = estado.aciertos + estado.fallos;
  if (total === 0) return 0;
  return Math.round((estado.aciertos / total) * 100);
}

/** Traduce el desempeno a un nivel de trucha. */
export function calcularNivel(estado: EstadoPartida): NivelTrucha {
  const porcentaje = porcentajeAciertos(estado);
  if (porcentaje >= 90) return NIVELES[3];
  if (porcentaje >= 70) return NIVELES[2];
  if (porcentaje >= 45) return NIVELES[1];
  return NIVELES[0];
}
