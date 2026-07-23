/**
 * Mensaje estilo Discord: sin burbujas — fila con avatar, nombre, hora y
 * texto debajo, como en la referencia. En el feedback resalta las senales
 * delatoras con el algoritmo compartido.
 */

import type { SenalDelatora } from '../../../types/escenario';
import { partirPorSenales } from '../resaltado';
import { AvatarDc } from './AvatarDc';

interface Props {
  nombre: string;
  avatar?: string;
  hora: string;
  texto: string;
  /** El mensaje es del nino (nombre en blurple, como usuario propio). */
  propio?: boolean;
  senalesResaltadas?: readonly SenalDelatora[];
}

export function MensajeDc({ nombre, avatar, hora, texto, propio = false, senalesResaltadas }: Props) {
  const partes = senalesResaltadas?.length
    ? partirPorSenales(texto, senalesResaltadas)
    : [{ texto, resaltado: false }];

  return (
    <div className="flex gap-3 px-4 py-1.5">
      <AvatarDc avatar={avatar} clase="h-10 w-10" claseEmoji="text-xl" />
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2">
          <span className={`text-[15px] font-semibold ${propio ? 'text-[var(--color-dc-blurple)]' : 'text-[var(--color-dc-texto)]'}`}>
            {nombre}
          </span>
          <span className="text-[11px] text-[var(--color-dc-texto-suave)]">{hora}</span>
        </p>
        <p className="text-[15px] leading-snug text-[var(--color-dc-texto)]">
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
        </p>
      </div>
    </div>
  );
}
