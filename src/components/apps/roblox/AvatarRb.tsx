/**
 * Avatar circular de Roblox: render del personaje sobre superficie oscura
 * y punto verde de "en linea" abajo a la derecha, como en la app real.
 */

interface Props {
  avatar: string;
  /** Diametro en clases tailwind, p. ej. "h-12 w-12". */
  clase?: string;
  enLinea?: boolean;
}

export function AvatarRb({ avatar, clase = 'h-12 w-12', enLinea = false }: Props) {
  return (
    <span className={`relative ${clase} shrink-0`}>
      <img
        src={avatar}
        alt=""
        draggable={false}
        className="h-full w-full rounded-full bg-[var(--color-rb-superficie-alta)] object-cover"
      />
      {enLinea && (
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--color-rb-fondo)] bg-[var(--color-rb-verde)]"
        />
      )}
    </span>
  );
}
