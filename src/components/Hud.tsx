/** Marcador compacto: ronda actual, puntaje y racha. */

interface Props {
  ronda: number;
  totalRondas: number;
  puntaje: number;
  racha: number;
}

export function Hud({ ronda, totalRondas, puntaje, racha }: Props) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-2xl bg-white/80 px-3 py-2 text-xs font-semibold text-[var(--color-texto-suave)] backdrop-blur">
      <span>
        Mensaje {ronda} de {totalRondas}
      </span>
      <span className="text-[var(--color-marca-600)]">{puntaje} pts</span>
      <span>{racha > 1 ? `🔥 ${racha}` : '—'}</span>
    </div>
  );
}
