/**
 * Avatar circular estilo Discord: imagen local o emoji sobre superficie
 * oscura, con punto verde de "en linea" opcional (como en la referencia).
 */

import { User } from 'lucide-react';

interface Props {
  /** Ruta de imagen (contiene '/' o '.') o emoji. */
  avatar?: string;
  /** Punto verde de estado en la esquina inferior derecha. */
  enLinea?: boolean;
  /** Diametro en clases tailwind, p. ej. "h-12 w-12". */
  clase?: string;
  /** Tamano del emoji interior. */
  claseEmoji?: string;
}

export function AvatarDc({ avatar, enLinea = false, clase = 'h-12 w-12', claseEmoji = 'text-2xl' }: Props) {
  const esImagen = !!avatar && (avatar.includes('/') || avatar.includes('.'));

  return (
    <span className={`relative ${clase} shrink-0`}>
      {esImagen ? (
        <img src={avatar} alt="" draggable={false} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-full w-full items-center justify-center rounded-full bg-[var(--color-dc-superficie-alta)] text-[var(--color-dc-texto-suave)]"
        >
          {avatar ? <span className={`${claseEmoji} leading-none`}>{avatar}</span> : <User className="h-1/2 w-1/2" />}
        </span>
      )}
      {enLinea && (
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-[var(--color-dc-fondo)] bg-[var(--color-dc-verde)]"
        />
      )}
    </span>
  );
}
