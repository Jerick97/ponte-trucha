/**
 * Fila de la lista de Mensajes de iOS: punto azul de no leido, avatar,
 * nombre en negrita, hora gris con chevron y vista previa en dos lineas.
 */

import { ChevronRight } from 'lucide-react';
import { AvatarSms } from './AvatarSms';

interface Props {
  nombre: string;
  vistaPrevia: string;
  hora: string;
  avatar?: string;
  sinLeer?: boolean;
  onAbrir?: () => void;
}

export function FilaSms({ nombre, vistaPrevia, hora, avatar, sinLeer = false, onAbrir }: Props) {
  const contenido = (
    <>
      {/* h-12 = alto del avatar: el punto queda centrado vertical con el */}
      <span className="flex h-12 w-4 shrink-0 items-center justify-center">
        {sinLeer && <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[var(--color-sms-azul)]" />}
        {sinLeer && <span className="sr-only">Sin leer</span>}
      </span>
      <AvatarSms avatar={avatar} clase="h-12 w-12" />
      <span className="min-w-0 flex-1 border-b border-[var(--color-sms-superficie)] pb-2.5">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[16px] font-semibold text-[var(--color-sms-texto)]">{nombre}</span>
          <span className="flex shrink-0 items-center gap-0.5 text-sm text-[var(--color-sms-texto-suave)]">
            {hora}
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          </span>
        </span>
        <span className="line-clamp-2 text-[15px] leading-snug text-[var(--color-sms-texto-suave)]">
          {vistaPrevia}
        </span>
      </span>
    </>
  );

  if (onAbrir) {
    return (
      <button type="button" onClick={onAbrir} className="flex w-full items-start gap-1.5 py-2 pl-1 pr-4 text-left">
        {contenido}
      </button>
    );
  }
  return (
    <div aria-hidden="true" className="flex items-start gap-1.5 py-2 pl-1 pr-4">
      {contenido}
    </div>
  );
}
