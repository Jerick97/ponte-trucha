/**
 * Globo de mensaje estilo iOS: entrantes en gris claro, propios en verde
 * SMS con texto blanco y "Entregado" debajo. En el feedback resalta las
 * senales delatoras con el algoritmo compartido.
 */

import type { SenalDelatora } from '../../../types/escenario';
import { partirPorSenales } from '../resaltado';

interface Props {
  texto: string;
  propia?: boolean;
  /** Muestra "Entregado" bajo el globo (ultimo mensaje propio). */
  entregado?: boolean;
  senalesResaltadas?: readonly SenalDelatora[];
}

export function BurbujaSms({ texto, propia = false, entregado = false, senalesResaltadas }: Props) {
  const partes = senalesResaltadas?.length
    ? partirPorSenales(texto, senalesResaltadas)
    : [{ texto, resaltado: false }];

  return (
    <div className={`flex flex-col px-4 py-0.5 ${propia ? 'items-end' : 'items-start'}`}>
      <p
        className={`max-w-[80%] rounded-3xl px-3.5 py-2 text-[16px] leading-snug ${
          propia
            ? 'rounded-br-md bg-[var(--color-sms-burbuja-propia)] text-white'
            : 'rounded-bl-md bg-[var(--color-sms-burbuja-entrante)] text-[var(--color-sms-texto)]'
        }`}
      >
        {partes.map((parte, i) =>
          parte.resaltado ? (
            <mark
              key={i}
              className="rounded bg-[var(--color-trampa)]/15 px-0.5 font-semibold text-[var(--color-trampa)]"
            >
              {parte.texto}
            </mark>
          ) : (
            <span key={i}>{parte.texto}</span>
          ),
        )}
      </p>
      {propia && entregado && (
        <span className="mt-0.5 pr-1 text-xs text-[var(--color-sms-texto-suave)]">Entregado</span>
      )}
    </div>
  );
}
