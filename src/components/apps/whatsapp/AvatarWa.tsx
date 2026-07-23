/**
 * Avatar circular estilo WhatsApp. Acepta una ruta de imagen local o un
 * emoji (los remitentes del banco pueden traer emoji como avatar); si no
 * hay nada, cae al placeholder de contacto/grupo de WhatsApp.
 */

import { User, Users } from 'lucide-react';

interface Props {
  /** Ruta de imagen (contiene '/') o emoji. */
  avatar?: string;
  esGrupo?: boolean;
  /** Diametro en clases tailwind, p. ej. "h-12 w-12". */
  clase?: string;
}

export function AvatarWa({ avatar, esGrupo = false, clase = 'h-12 w-12' }: Props) {
  const esImagen = !!avatar && (avatar.includes('/') || avatar.includes('.'));

  if (esImagen) {
    return (
      <img
        src={avatar}
        alt=""
        draggable={false}
        className={`${clase} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${clase} flex shrink-0 items-center justify-center rounded-full bg-[var(--color-wa-superficie-alta)] text-[var(--color-wa-texto-suave)]`}
    >
      {avatar ? (
        <span className="text-2xl leading-none">{avatar}</span>
      ) : esGrupo ? (
        <Users className="h-6 w-6" />
      ) : (
        <User className="h-6 w-6" />
      )}
    </span>
  );
}
