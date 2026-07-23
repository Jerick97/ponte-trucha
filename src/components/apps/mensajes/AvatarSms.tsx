/**
 * Avatar circular estilo iOS: retrato local o el placeholder gris
 * degradado con la silueta blanca que Mensajes muestra para numeros
 * desconocidos (como en la referencia de spam). Los avatares de emoji del
 * banco tambien caen a la silueta: un remitente desconocido real de SMS
 * nunca trae foto, y el emoji rompia la ilusion.
 */

import { User } from 'lucide-react';

interface Props {
  /** Ruta de imagen (contiene '/'); emoji o vacio = silueta gris. */
  avatar?: string;
  /** Diametro en clases tailwind, p. ej. "h-12 w-12". */
  clase?: string;
}

export function AvatarSms({ avatar, clase = 'h-12 w-12' }: Props) {
  const esImagen = !!avatar && avatar.includes('/');

  if (esImagen) {
    return (
      <img src={avatar} alt="" draggable={false} className={`${clase} shrink-0 rounded-full object-cover`} />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${clase} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[var(--color-sms-avatar-arriba)] to-[var(--color-sms-avatar-abajo)] text-white`}
    >
      <User className="h-3/5 w-3/5 fill-white" />
    </span>
  );
}
