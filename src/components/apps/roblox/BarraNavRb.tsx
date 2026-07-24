/**
 * Barra inferior de la app Roblox (version en español, como la captura de
 * Jerick): Inicio, Destacadas, Avatar, Equipo y Mas. Solo Inicio y Equipo
 * navegan; el resto es decorativo.
 */

import { ChartNoAxesColumn, House, Menu, UsersRound } from 'lucide-react';
import { JUGADOR_RB } from './datosMock';

interface Props {
  activa: 'inicio' | 'equipo';
  onIrInicio: () => void;
  onIrEquipo: () => void;
  /** Muestra el globito azul sobre Equipo (mensaje del escenario). */
  sinLeerEquipo?: boolean;
}

const CLASE_TAB = 'flex flex-1 flex-col items-center gap-0.5 pb-1 pt-2 text-[10px]';

export function BarraNavRb({ activa, onIrInicio, onIrEquipo, sinLeerEquipo = false }: Props) {
  const color = (tab: 'inicio' | 'equipo') =>
    activa === tab ? 'text-[var(--color-rb-texto)]' : 'text-[var(--color-rb-texto-suave)]';

  return (
    <nav aria-label="Navegación de Roblox" className="flex border-t border-[var(--color-rb-superficie)] bg-[var(--color-rb-fondo)] pb-4">
      <button type="button" onClick={onIrInicio} className={`${CLASE_TAB} ${color('inicio')}`}>
        <House aria-hidden="true" className="h-5 w-5" />
        Inicio
      </button>
      <span aria-hidden="true" className={`${CLASE_TAB} text-[var(--color-rb-texto-suave)]`}>
        <ChartNoAxesColumn className="h-5 w-5" />
        Destacadas
      </span>
      <span aria-hidden="true" className={`${CLASE_TAB} text-[var(--color-rb-texto-suave)]`}>
        <img src={JUGADOR_RB.avatar} alt="" draggable={false} className="h-5 w-5 rounded-full bg-[var(--color-rb-superficie-alta)]" />
        Avatar
      </span>
      <button type="button" onClick={onIrEquipo} className={`relative ${CLASE_TAB} ${color('equipo')}`}>
        <span className="relative">
          <UsersRound aria-hidden="true" className="h-5 w-5" />
          {sinLeerEquipo && (
            <span className="absolute -right-1.5 -top-1 h-2.5 w-2.5 rounded-full bg-[var(--color-rb-azul)]">
              <span className="sr-only">Mensaje nuevo</span>
            </span>
          )}
        </span>
        Equipo
      </button>
      <span aria-hidden="true" className={`${CLASE_TAB} text-[var(--color-rb-texto-suave)]`}>
        <Menu className="h-5 w-5" />
        Más
      </span>
    </nav>
  );
}
