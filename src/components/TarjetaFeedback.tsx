/**
 * Momento educativo: aparece justo despues de responder.
 * Explica por que era trampa (o por que era real) con las senales del escenario.
 *
 * Owner del copy: Contenido (Clau). Owner del layout: UI (Jerick).
 */

import type { Escenario } from '../types/escenario';

interface Props {
  escenario: Escenario;
  acerto: boolean;
  puntosGanados: number;
  /** Se muestra solo si el escenario permite conversar con el estafador. */
  onChatear?: () => void;
  onSiguiente: () => void;
}

export function TarjetaFeedback({
  escenario,
  acerto,
  puntosGanados,
  onChatear,
  onSiguiente,
}: Props) {
  const esEstafa = escenario.tipo !== 'legitimo';

  return (
    <section
      aria-live="polite"
      className="rounded-3xl bg-white p-4 shadow-lg ring-1 ring-black/5"
    >
      <header className="mb-3 flex items-center gap-2">
        <span aria-hidden className="text-2xl">
          {acerto ? '🎉' : '😮'}
        </span>
        <h2 className="text-lg font-bold">
          {acerto ? '¡Bien ahí!' : 'Casi...'}
          {puntosGanados > 0 && (
            <span className="ml-2 text-sm font-semibold text-[var(--color-marca-500)]">
              +{puntosGanados}
            </span>
          )}
        </h2>
      </header>

      <p className="mb-3 text-sm text-[var(--color-texto-suave)]">
        {esEstafa ? 'Este mensaje era una trampa.' : 'Este mensaje era real y seguro.'}
      </p>

      <ul className="mb-4 space-y-2">
        {escenario.senales.map((senal) => (
          <li key={senal.fragmento} className="rounded-2xl bg-[var(--color-marca-050)] p-3">
            <p className="text-sm font-semibold text-[var(--color-marca-600)]">
              “{senal.fragmento}”
            </p>
            <p className="text-sm text-[var(--color-texto)]">{senal.explicacion}</p>
          </li>
        ))}
      </ul>

      <p className="mb-4 rounded-2xl bg-[var(--color-confianza-suave)] p-3 text-sm font-semibold">
        💡 {escenario.leccion}
      </p>

      <div className="flex flex-col gap-2">
        {escenario.permiteConversacion && onChatear && (
          <button
            type="button"
            onClick={onChatear}
            className="min-h-12 rounded-2xl border-2 border-[var(--color-marca-500)] px-4 text-sm font-bold text-[var(--color-marca-600)]"
          >
            😈 Respóndele al estafador
          </button>
        )}
        <button
          type="button"
          onClick={onSiguiente}
          className="min-h-12 rounded-2xl bg-[var(--color-marca-500)] px-4 text-sm font-bold text-white"
        >
          Siguiente mensaje
        </button>
      </div>
    </section>
  );
}
