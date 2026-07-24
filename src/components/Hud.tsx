/** Marcador compacto: ronda actual, puntaje y racha. */

interface Props {
  ronda: number;
  totalRondas: number;
  puntaje: number;
  racha: number;
}

/** A partir de esta racha el bonus por acierto ya esta al maximo. */
const TOPE_RACHA = 4;

export function Hud({ ronda, totalRondas, puntaje, racha }: Props) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-2xl bg-white/80 px-3 py-2 text-xs font-semibold text-[var(--color-texto-suave)] backdrop-blur">
      <span>
        Mensaje {ronda} de {totalRondas}
      </span>
      <span className="text-[var(--color-marca-600)]">{puntaje} pts</span>
      <IndicadorRacha racha={racha} />
    </div>
  );
}

/** Racha con fueguito y puntos que se llenan hasta el tope del bonus. */
function IndicadorRacha({ racha }: { racha: number }) {
  if (racha < 1) {
    return <span aria-label="Sin racha">—</span>;
  }
  const enLlamas = racha >= 3;
  const llenos = Math.min(racha, TOPE_RACHA);

  return (
    <span className="flex items-center gap-1.5" aria-label={`Racha de ${racha}`}>
      <span className={enLlamas ? 'racha-encendida' : ''} aria-hidden="true">
        🔥
      </span>
      <span className="text-[var(--color-nivel-despierto)]">{racha}</span>
      <span className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: TOPE_RACHA }, (_, i) => (
          <span
            key={i}
            className={
              i < llenos
                ? 'h-1.5 w-1.5 rounded-full bg-[var(--color-nivel-despierto)]'
                : 'h-1.5 w-1.5 rounded-full bg-[var(--color-texto-suave)] opacity-25'
            }
          />
        ))}
      </span>
    </span>
  );
}
