/**
 * Feedback educativo dentro de la conversacion de WhatsApp: mantiene el
 * contenido de siempre (senales + leccion) con la piel oscura del canal.
 */

import { CircleAlert, Lightbulb, MessageCircleReply, PartyPopper } from 'lucide-react';
import type { Escenario } from '../../../types/escenario';

interface Props {
  escenario: Escenario;
  acerto: boolean;
  puntosGanados: number;
  onChatear?: () => void;
  onSiguiente: () => void;
}

export function TarjetaFeedbackWa({ escenario, acerto, puntosGanados, onChatear, onSiguiente }: Props) {
  const esEstafa = escenario.tipo !== 'legitimo';

  return (
    <section
      aria-live="polite"
      className="mx-3 my-2 rounded-2xl bg-[var(--color-wa-superficie)] p-4 text-[var(--color-wa-texto)] shadow-lg"
    >
      <header className="mb-2 flex items-center gap-2">
        {acerto ? (
          <PartyPopper aria-hidden="true" className="h-6 w-6 text-[var(--color-wa-verde)]" />
        ) : (
          <CircleAlert aria-hidden="true" className="h-6 w-6 text-[var(--color-trampa)]" />
        )}
        <h2 className="text-lg font-bold">
          {acerto ? '¡Bien ahí!' : 'Casi...'}
          {puntosGanados > 0 && (
            <span className="ml-2 text-sm font-semibold text-[var(--color-wa-verde)]">
              +{puntosGanados}
            </span>
          )}
        </h2>
      </header>

      <p className="mb-3 text-sm text-[var(--color-wa-texto-suave)]">
        {esEstafa ? 'Este mensaje era una trampa.' : 'Este mensaje era real y seguro.'}
      </p>

      <ul className="mb-3 space-y-2">
        {escenario.senales.map((senal) => (
          <li key={senal.fragmento} className="rounded-xl bg-[var(--color-wa-superficie-alta)] p-3">
            <p className="text-sm font-semibold text-[var(--color-trampa)]">“{senal.fragmento}”</p>
            <p className="text-sm">{senal.explicacion}</p>
          </li>
        ))}
      </ul>

      <p className="mb-4 flex items-start gap-2 rounded-xl bg-[var(--color-wa-chip-activo)] p-3 text-sm font-semibold text-[var(--color-wa-texto)]">
        <Lightbulb aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-wa-verde)]" />
        {escenario.leccion}
      </p>

      <div className="flex flex-col gap-2">
        {escenario.permiteConversacion && onChatear && (
          <button
            type="button"
            onClick={onChatear}
            className="flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-[var(--color-wa-verde)] px-4 text-sm font-bold text-[var(--color-wa-verde)]"
          >
            <MessageCircleReply aria-hidden="true" className="h-4 w-4" />
            Respóndele al estafador
          </button>
        )}
        <button
          type="button"
          onClick={onSiguiente}
          className="min-h-12 rounded-full bg-[var(--color-wa-verde)] px-4 text-sm font-bold text-[var(--color-wa-fondo)]"
        >
          Siguiente mensaje
        </button>
      </div>
    </section>
  );
}
