/**
 * Barra inferior con el perfil del jugador (avatar, nombre, "En linea" y
 * campana), como en la referencia. Tocarla abre la pantalla de perfil.
 */

import { Bell } from 'lucide-react';
import { AvatarDc } from './AvatarDc';
import { JUGADOR } from './datosMock';

interface Props {
  onAbrirPerfil: () => void;
}

export function PieUsuario({ onAbrirPerfil }: Props) {
  return (
    <div className="flex items-center gap-2 rounded-t-3xl bg-[var(--color-dc-superficie)]/80 px-3 pb-5 pt-2">
      <button
        type="button"
        aria-label="Ver tu perfil"
        onClick={onAbrirPerfil}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-full py-1 text-left"
      >
        <AvatarDc avatar={JUGADOR.avatar} enLinea clase="h-10 w-10" claseEmoji="text-xl" />
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold text-[var(--color-dc-texto)]">
            {JUGADOR.nombre}
          </span>
          <span className="block text-xs text-[var(--color-dc-texto-suave)]">En línea</span>
        </span>
      </button>
      <span
        aria-hidden="true"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-dc-superficie-alta)]/60 text-[var(--color-dc-texto)]"
      >
        <Bell className="h-5 w-5" />
      </span>
    </div>
  );
}
