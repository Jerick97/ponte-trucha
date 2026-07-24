/**
 * Rail izquierdo de Discord: boton de mensajes directos arriba (se pinta
 * blurple cuando esta activo, como en la referencia) y la columna de
 * servidores con sus burbujas de no-leidos.
 */

import { LogoDiscord } from './LogoDiscord';
import { SERVIDORES_MOCK } from './datosMock';

interface Props {
  /** Vista activa: pinta el boton de DMs o el servidor correspondiente. */
  vista: 'mensajes' | 'servidor';
  /** Burbuja de no-leidos sobre el boton de DMs (el escenario pendiente). */
  dmsSinLeer?: number;
  onIrMensajes: () => void;
  onIrServidor: () => void;
}

export function RailServidores({ vista, dmsSinLeer = 0, onIrMensajes, onIrServidor }: Props) {
  return (
    <nav aria-label="Servidores" className="sin-scrollbar flex h-full w-[72px] shrink-0 flex-col items-center gap-2 overflow-y-auto bg-[var(--color-dc-rail)] py-2">
      {/* Mensajes directos */}
      <span className="relative">
        <button
          type="button"
          aria-label="Mensajes directos"
          aria-pressed={vista === 'mensajes'}
          onClick={onIrMensajes}
          className={`flex h-12 w-12 items-center justify-center transition-all ${
            vista === 'mensajes'
              ? 'rounded-2xl bg-[var(--color-dc-blurple)] text-white'
              : 'rounded-full bg-[var(--color-dc-superficie)] text-[var(--color-dc-texto-suave)]'
          }`}
        >
          <LogoDiscord className="h-6 w-6" />
        </button>
        {dmsSinLeer > 0 && (
          <span
            aria-hidden="true"
            className="absolute -bottom-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-[3px] border-[var(--color-dc-rail)] bg-[var(--color-dc-rojo)] px-1 text-[10px] font-bold text-white"
          >
            {dmsSinLeer}
          </span>
        )}
      </span>

      <span aria-hidden="true" className="h-0.5 w-8 rounded-full bg-[var(--color-dc-superficie)]" />

      {SERVIDORES_MOCK.map((servidor, i) => {
        const activo = vista === 'servidor' && i === 0;
        return (
          <span key={servidor.id} className="relative flex items-center">
            {/* Pildora blanca del servidor activo */}
            {activo && (
              <span aria-hidden="true" className="absolute -left-4 h-8 w-1 rounded-r-full bg-[var(--color-dc-texto)]" />
            )}
            <button
              type="button"
              aria-label={`Servidor ${servidor.nombre}`}
              aria-pressed={activo}
              onClick={i === 0 ? onIrServidor : undefined}
              className={`flex h-12 w-12 items-center justify-center text-2xl transition-all ${
                activo ? 'rounded-2xl bg-[var(--color-dc-superficie-alta)]' : 'rounded-full bg-[var(--color-dc-superficie)]'
              }`}
            >
              <span aria-hidden="true">{servidor.emoji}</span>
            </button>
            {!!servidor.noLeidos && (
              <span
                aria-hidden="true"
                className="absolute -bottom-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-[3px] border-[var(--color-dc-rail)] bg-[var(--color-dc-rojo)] px-1 text-[10px] font-bold text-white"
              >
                {servidor.noLeidos}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
