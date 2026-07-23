/**
 * Fila de la lista de chats: avatar, nombre, vista previa y metadatos
 * (hora + burbuja de no leidos, en verde cuando hay pendientes).
 */

import { Camera, Mic } from 'lucide-react';
import { AvatarWa } from './AvatarWa';

interface Props {
  nombre: string;
  vistaPrevia: string;
  hora: string;
  avatar?: string;
  esGrupo?: boolean;
  noLeidos?: number;
  tipoAdjunto?: 'foto' | 'audio';
  /** Solo la fila del escenario es interactiva. */
  onAbrir?: () => void;
}

export function FilaChat({
  nombre,
  vistaPrevia,
  hora,
  avatar,
  esGrupo,
  noLeidos = 0,
  tipoAdjunto,
  onAbrir,
}: Props) {
  const contenido = (
    <>
      <AvatarWa avatar={avatar} esGrupo={esGrupo} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-left text-[16px] font-semibold text-[var(--color-wa-texto)]">
          {nombre}
        </span>
        <span className="flex items-center gap-1 text-left text-sm text-[var(--color-wa-texto-suave)]">
          {tipoAdjunto === 'foto' && <Camera aria-hidden="true" className="h-4 w-4 shrink-0" />}
          {tipoAdjunto === 'audio' && <Mic aria-hidden="true" className="h-4 w-4 shrink-0" />}
          <span className="truncate">{vistaPrevia}</span>
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={`text-xs ${noLeidos > 0 ? 'font-semibold text-[var(--color-wa-badge)]' : 'text-[var(--color-wa-texto-suave)]'}`}
        >
          {hora}
        </span>
        {noLeidos > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-wa-badge)] px-1.5 text-xs font-bold text-[var(--color-wa-fondo)]">
            {noLeidos}
          </span>
        )}
      </span>
    </>
  );

  const clase = 'flex w-full items-center gap-3 px-4 py-2.5';

  if (onAbrir) {
    return (
      <button type="button" onClick={onAbrir} className={`${clase} min-h-16 active:bg-[var(--color-wa-superficie)]`}>
        {contenido}
      </button>
    );
  }
  return <div className={clase}>{contenido}</div>;
}
