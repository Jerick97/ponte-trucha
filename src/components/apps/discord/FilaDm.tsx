/**
 * Fila de un mensaje directo en la lista de Mensajes: avatar con estado,
 * nombre, vista previa y hora. Solo el DM del escenario es interactivo.
 */

import { AvatarDc } from './AvatarDc';

interface Props {
  nombre: string;
  vistaPrevia: string;
  hora: string;
  avatar?: string;
  enLinea?: boolean;
  noLeidos?: number;
  onAbrir?: () => void;
}

export function FilaDm({ nombre, vistaPrevia, hora, avatar, enLinea, noLeidos = 0, onAbrir }: Props) {
  const contenido = (
    <>
      <AvatarDc avatar={avatar} enLinea={enLinea} clase="h-11 w-11" />
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[15px] ${noLeidos ? 'font-bold text-[var(--color-dc-texto)]' : 'font-semibold text-[var(--color-dc-texto)]'}`}>
          {nombre}
        </span>
        <span className={`block truncate text-sm ${noLeidos ? 'font-medium text-[var(--color-dc-texto)]' : 'text-[var(--color-dc-texto-suave)]'}`}>
          {vistaPrevia}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-xs text-[var(--color-dc-texto-suave)]">{hora}</span>
        {noLeidos > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-dc-rojo)] px-1.5 text-[11px] font-bold text-white">
            {noLeidos}
          </span>
        )}
      </span>
    </>
  );

  if (onAbrir) {
    return (
      <button type="button" onClick={onAbrir} className="flex w-full items-center gap-3 px-4 py-2.5 text-left">
        {contenido}
      </button>
    );
  }
  return (
    <div aria-hidden="true" className="flex items-center gap-3 px-4 py-2.5">
      {contenido}
    </div>
  );
}
