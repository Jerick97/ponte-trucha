/**
 * Logo cuadrado inclinado de Roblox como SVG inline (path oficial de
 * simple-icons, el mismo del icono del home): hereda el color del texto.
 */

interface Props {
  className?: string;
}

export function LogoRoblox({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M18.926 23.998 0 18.892 5.075.002 24 5.108ZM15.348 10.09l-5.282-1.453-1.414 5.273 5.282 1.453z" />
    </svg>
  );
}
