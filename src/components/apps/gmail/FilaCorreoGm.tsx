/**
 * Fila de la bandeja de Gmail: avatar, remitente, asunto y vista previa
 * en una linea cada uno, con la fecha y la estrella a la derecha. Los no
 * leidos van en negrita, como en la app real.
 */

import { Star } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  avatar: ReactNode;
  remitente: string;
  asunto: string;
  vistaPrevia: string;
  fecha: string;
  sinLeer?: boolean;
  /** Con handler la fila es un boton (el correo del escenario). */
  onAbrir?: () => void;
}

export function FilaCorreoGm({ avatar, remitente, asunto, vistaPrevia, fecha, sinLeer, onAbrir }: Props) {
  const Etiqueta = onAbrir ? 'button' : 'div';
  const negrita = sinLeer ? 'font-bold text-[var(--color-gm-texto)]' : '';

  return (
    <Etiqueta
      {...(onAbrir ? { type: 'button' as const, onClick: onAbrir } : {})}
      className="flex w-full items-start gap-4 px-4 py-2.5 text-left"
    >
      {avatar}
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[15px] ${negrita || 'text-[var(--color-gm-texto)]'}`}>
          {remitente}
        </span>
        <span className={`block truncate text-sm ${negrita || 'text-[var(--color-gm-texto)]'}`}>
          {asunto}
        </span>
        <span className="block truncate text-sm text-[var(--color-gm-texto-suave)]">{vistaPrevia}</span>
      </span>
      <span className="flex flex-col items-end gap-2 pt-0.5">
        <span className={`text-xs ${sinLeer ? 'font-bold text-[var(--color-gm-texto)]' : 'text-[var(--color-gm-texto-suave)]'}`}>
          {fecha}
        </span>
        <Star aria-hidden="true" className="h-5 w-5 text-[var(--color-gm-texto-suave)]" />
      </span>
    </Etiqueta>
  );
}
