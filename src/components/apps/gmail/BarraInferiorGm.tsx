/**
 * Barra inferior de Gmail con las pestanas Correo y Meet: la activa lleva
 * la pildora celeste detras del icono y el sobre carga su globo rojo de
 * no leidos, como en la app real.
 */

import { Mail, Video } from 'lucide-react';

interface Props {
  activa: 'correo' | 'meet';
  onIrCorreo: () => void;
  onIrMeet: () => void;
}

export function BarraInferiorGm({ activa, onIrCorreo, onIrMeet }: Props) {
  const pildora = (esActiva: boolean) =>
    `relative flex h-8 w-16 items-center justify-center rounded-full ${
      esActiva ? 'bg-[var(--color-gm-seleccion)]' : ''
    }`;

  return (
    <nav aria-label="Pestañas de Gmail" className="flex shrink-0 items-center justify-around bg-[var(--color-gm-superficie)]/60 pb-5 pt-2">
      <button type="button" aria-label="Correo" onClick={onIrCorreo} className="flex flex-col items-center">
        <span className={pildora(activa === 'correo')}>
          <Mail aria-hidden="true" className="h-5 w-5 text-[var(--color-gm-texto)]" />
          <span
            aria-hidden="true"
            className="absolute -top-1 left-8 rounded-full bg-[var(--color-gm-rojo)] px-1.5 py-px text-[10px] font-bold text-white"
          >
            99+
          </span>
        </span>
      </button>
      <button type="button" aria-label="Meet" onClick={onIrMeet} className="flex flex-col items-center">
        <span className={pildora(activa === 'meet')}>
          <Video aria-hidden="true" className="h-5 w-5 text-[var(--color-gm-texto)]" />
        </span>
      </button>
    </nav>
  );
}
