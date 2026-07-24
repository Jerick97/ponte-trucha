/**
 * Fila de la vista Equipo (chats de Roblox): avatar con punto de en linea,
 * nombre, vista previa con la hora y globito azul si esta sin leer.
 */

import { AvatarRb } from './AvatarRb';

interface Props {
  nombre: string;
  avatar: string;
  vistaPrevia: string;
  hora: string;
  enLinea?: boolean;
  sinLeer?: boolean;
  onAbrir?: () => void;
}

export function FilaChatRb({ nombre, avatar, vistaPrevia, hora, enLinea = false, sinLeer = false, onAbrir }: Props) {
  const contenido = (
    <>
      <AvatarRb avatar={avatar} clase="h-12 w-12" enLinea={enLinea} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-[var(--color-rb-texto)]">{nombre}</span>
        <span className={`block truncate text-sm ${sinLeer ? 'font-semibold text-[var(--color-rb-texto)]' : 'text-[var(--color-rb-texto-suave)]'}`}>
          {vistaPrevia} <span className="font-normal text-[var(--color-rb-texto-suave)]">· {hora}</span>
        </span>
      </span>
      {sinLeer && (
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-rb-azul)]">
          <span className="sr-only">Sin leer</span>
        </span>
      )}
    </>
  );

  if (onAbrir) {
    return (
      <button type="button" onClick={onAbrir} className="flex w-full items-center gap-3 px-4 py-2 text-left">
        {contenido}
      </button>
    );
  }
  return (
    <div aria-hidden="true" className="flex items-center gap-3 px-4 py-2">
      {contenido}
    </div>
  );
}
