/**
 * La unica decision del loop principal: trampa o de confianza.
 * Botones grandes, pensados para dedo de nino en movil (min 56px de alto).
 */

import type { Veredicto } from '../types/escenario';

interface Props {
  onResponder: (respuesta: Veredicto) => void;
  deshabilitado?: boolean;
}

export function BarraDecision({ onResponder, deshabilitado = false }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        disabled={deshabilitado}
        onClick={() => onResponder('trampa')}
        className="min-h-14 rounded-2xl bg-[var(--color-trampa)] px-4 text-base font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
      >
        🚨 Es trampa
      </button>
      <button
        type="button"
        disabled={deshabilitado}
        onClick={() => onResponder('confianza')}
        className="min-h-14 rounded-2xl bg-[var(--color-confianza)] px-4 text-base font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
      >
        ✅ De confianza
      </button>
    </div>
  );
}
