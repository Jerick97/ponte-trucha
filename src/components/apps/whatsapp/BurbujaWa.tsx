/**
 * Burbuja de mensaje estilo WhatsApp oscuro: entrantes en gris, propias
 * en verde con doble check azul. En el feedback resalta las senales
 * delatoras con el mismo algoritmo de siempre.
 */

import { CheckCheck } from 'lucide-react';
import type { SenalDelatora } from '../../../types/escenario';
import { partirPorSenales } from '../resaltado';

interface Props {
  texto: string;
  propia?: boolean;
  hora: string;
  senalesResaltadas?: readonly SenalDelatora[];
}

export function BurbujaWa({ texto, propia = false, hora, senalesResaltadas }: Props) {
  const partes = senalesResaltadas?.length
    ? partirPorSenales(texto, senalesResaltadas)
    : [{ texto, resaltado: false }];

  return (
    <div className={`flex px-3 py-1 ${propia ? 'justify-end' : 'justify-start'}`}>
      <p
        className={`max-w-[85%] rounded-lg px-3 py-1.5 text-[15px] leading-snug text-[var(--color-wa-texto)] shadow-sm ${
          propia
            ? 'rounded-tr-none bg-[var(--color-wa-burbuja-salida)]'
            : 'rounded-tl-none bg-[var(--color-wa-superficie)]'
        }`}
      >
        {partes.map((parte, i) =>
          parte.resaltado ? (
            <mark
              key={i}
              className="rounded bg-[var(--color-trampa)]/25 px-0.5 font-semibold text-[var(--color-trampa)]"
            >
              {parte.texto}
            </mark>
          ) : (
            <span key={i}>{parte.texto}</span>
          ),
        )}
        <span className="float-right ml-2 mt-2.5 flex items-center gap-1 text-[11px] text-[var(--color-wa-texto-suave)]">
          {hora}
          {propia && (
            <CheckCheck aria-hidden="true" className="h-4 w-4 text-[var(--color-wa-check)]" />
          )}
        </span>
      </p>
    </div>
  );
}
