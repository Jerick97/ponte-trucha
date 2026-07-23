/** Franja superior del sistema: hora, senal y bateria simuladas. */

import { BATERIA_SIMULADA, HORA_SIMULADA } from './simulados';

interface Props {
  /** Texto claro (pantallas oscuras: lock, home) u oscuro (apps claras). */
  claro?: boolean;
}

export function StatusBar({ claro = true }: Props) {
  const color = claro ? 'text-[var(--color-lock-texto)]' : 'text-[var(--color-texto)]';
  const barra = claro ? 'bg-[var(--color-lock-texto)]' : 'bg-[var(--color-texto)]';

  return (
    <div className={`relative z-20 flex h-10 items-center justify-between px-7 pt-1 text-[11px] font-semibold ${color}`}>
      <span>{HORA_SIMULADA}</span>
      <div className="flex items-center gap-2">
        {/* Senal */}
        <span aria-hidden="true" className="flex items-end gap-[2px]">
          <i className={`h-1 w-[3px] rounded-sm ${barra}`} />
          <i className={`h-1.5 w-[3px] rounded-sm ${barra}`} />
          <i className={`h-2 w-[3px] rounded-sm ${barra}`} />
          <i className={`h-2.5 w-[3px] rounded-sm ${barra} opacity-40`} />
        </span>
        {/* Bateria */}
        <span className="flex items-center gap-1">
          <span className="sr-only">Bateria al {BATERIA_SIMULADA} por ciento</span>
          <i
            aria-hidden="true"
            className={`relative h-3 w-6 rounded-[4px] border ${claro ? 'border-[var(--color-lock-texto)]/60' : 'border-[var(--color-texto)]/60'}`}
          >
            <i
              className={`absolute inset-y-[2px] left-[2px] rounded-[2px] ${barra}`}
              style={{ width: `${BATERIA_SIMULADA * 0.2}px` }}
            />
          </i>
        </span>
      </div>
    </div>
  );
}
