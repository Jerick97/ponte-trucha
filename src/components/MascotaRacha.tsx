/**
 * Mascota que celebra la racha: el pez trucha salta al acertar y evoluciona
 * por tramos. Tramo 1 (chispa verde), tramo 2 (corriente cyan) y tramo 3
 * "super trucha" (aura purpura con estrellas y rotulo). Adorno visual puro:
 * recibe la racha por props y no conoce reglas del juego.
 *
 * El pez sigue siendo un emoji para no sumar peso al bundle; el "look" lo dan
 * los estilos (filtros, aura y particulas). Si mas adelante hay un sprite
 * ilustrado, se cambia el <span> del pez por un <img> sin tocar la logica.
 */

import type { CSSProperties } from 'react';

interface Props {
  /** Racha actual (numero de aciertos seguidos). */
  racha: number;
}

/** Tramo visual segun la racha: 1 chispa, 2 corriente, 3 super trucha. */
function tramoDeRacha(racha: number): 1 | 2 | 3 {
  if (racha >= 6) return 3;
  if (racha >= 4) return 2;
  return 1;
}

// Glifo y cantidad de particulas que rodean al pez en cada tramo.
const PARTICULAS: Record<1 | 2 | 3, { glifo: string; cantidad: number }> = {
  1: { glifo: '✦', cantidad: 5 },
  2: { glifo: '○', cantidad: 8 },
  3: { glifo: '★', cantidad: 12 },
};

export function MascotaRacha({ racha }: Props) {
  const tramo = tramoDeRacha(racha);
  const { glifo, cantidad } = PARTICULAS[tramo];

  return (
    <div className={`mascota-racha mascota-racha--${tramo}`} aria-hidden="true">
      {tramo === 3 && <span className="mascota-racha__titulo">¡SÚPER TRUCHA!</span>}

      <div className="mascota-racha__escena">
        {tramo === 3 && <span className="mascota-racha__aura" />}

        {Array.from({ length: cantidad }, (_, i) => {
          const estilo = {
            '--ang': `${(360 / cantidad) * i}deg`,
            '--retraso': `${(i % 4) * 0.06}s`,
          } as CSSProperties;
          return (
            <span key={i} className="mascota-racha__particula" style={estilo}>
              {glifo}
            </span>
          );
        })}

        <span className="mascota-racha__pez">🐟</span>
      </div>

      {racha >= 2 && <span className="mascota-racha__combo">¡x{racha}!</span>}
    </div>
  );
}
