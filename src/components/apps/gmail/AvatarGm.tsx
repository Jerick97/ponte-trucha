/**
 * Avatar circular de Gmail: imagen local si el banco trae ruta, o el
 * circulo de color con la inicial que Gmail genera para remitentes sin
 * foto (los emojis del banco tambien caen a la inicial: en el correo real
 * nadie tiene un emoji de avatar).
 */

interface Props {
  /** Ruta de imagen (contiene '/'); emoji o vacio = inicial de color. */
  avatar?: string;
  /** Nombre del remitente, para la inicial y el color determinista. */
  nombre: string;
  /** Clases de token para el fondo del circulo de inicial. */
  claseColor: string;
  /** Diametro en clases tailwind, p. ej. "h-10 w-10". */
  clase?: string;
}

export function AvatarGm({ avatar, nombre, claseColor, clase = 'h-10 w-10' }: Props) {
  const esImagen = !!avatar && avatar.includes('/');

  if (esImagen) {
    return (
      <img src={avatar} alt="" draggable={false} className={`${clase} shrink-0 rounded-full object-cover`} />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${clase} ${claseColor} flex shrink-0 items-center justify-center rounded-full text-lg font-medium text-white`}
    >
      {nombre.charAt(0).toUpperCase()}
    </span>
  );
}
