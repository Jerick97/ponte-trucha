/**
 * Globo de chat de Roblox: entrantes en gris oscuro, propios en el azul
 * de la marca, como la referencia de Party. En el feedback resalta las
 * senales delatoras con el algoritmo compartido.
 */

import type { SenalDelatora } from '../../../types/escenario';
import { partirPorSenales } from '../resaltado';

interface Props {
  texto: string;
  propia?: boolean;
  senalesResaltadas?: readonly SenalDelatora[];
}

export function BurbujaRb({ texto, propia = false, senalesResaltadas }: Props) {
  const partes = senalesResaltadas?.length
    ? partirPorSenales(texto, senalesResaltadas)
    : [{ texto, resaltado: false }];

  return (
    <div className={`flex px-4 py-0.5 ${propia ? 'justify-end' : 'justify-start'}`}>
      <p
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug ${
          propia
            ? 'rounded-br-md bg-[var(--color-rb-azul)] text-white'
            : 'rounded-bl-md bg-[var(--color-rb-superficie-alta)] text-[var(--color-rb-texto)]'
        }`}
      >
        {partes.map((parte, i) =>
          parte.resaltado ? (
            <mark key={i} className="rounded bg-[var(--color-trampa)]/30 px-0.5 font-semibold text-white">
              {parte.texto}
            </mark>
          ) : (
            <span key={i}>{parte.texto}</span>
          ),
        )}
      </p>
    </div>
  );
}
