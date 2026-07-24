/**
 * Mascota que celebra la racha: el pez trucha salta al acertar. La
 * intensidad (tamano y "combo") sube por tramos de racha. Adorno visual
 * puro; recibe la racha por props y no conoce reglas del juego.
 *
 * Hoy es un emoji para no sumar peso al bundle. Si mas adelante hay un
 * sprite ilustrado, se cambia el <span> por un <img> sin tocar la logica.
 */

interface Props {
  /** Racha actual (numero de aciertos seguidos). */
  racha: number;
}

export function MascotaRacha({ racha }: Props) {
  const nivel = racha >= 5 ? 3 : racha >= 3 ? 2 : 1;

  return (
    <div className={`mascota-racha mascota-racha--${nivel}`} aria-hidden="true">
      <span className="mascota-racha__pez">🐟</span>
      {racha >= 2 && <span className="mascota-racha__combo">¡x{racha}!</span>}
    </div>
  );
}
