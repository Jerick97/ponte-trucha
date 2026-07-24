/**
 * Pantallas de carga de Roblox, como en la app real: primero el icono
 * cuadrado (en el azul actual, ya no negro) sobre fondo blanco y luego el
 * logo horizontal con el "Cargando..." abajo.
 */

import { StatusBar } from '../../telefono/StatusBar';
import logoHorizontal from '../../../assets/img/roblox/Roblox Logo SVG.svg';
import { LogoRoblox } from './LogoRoblox';

interface Props {
  etapa: 'icono' | 'cargando';
}

export function SplashRb({ etapa }: Props) {
  return (
    <div className="flex h-full flex-col bg-white">
      <StatusBar claro={false} />
      {etapa === 'icono' ? (
        <div className="flex flex-1 items-center justify-center">
          <span className="flex h-24 w-24 items-center justify-center rounded-3xl bg-[var(--color-rb-azul)] shadow-lg">
            <LogoRoblox className="h-14 w-14 text-white" />
          </span>
        </div>
      ) : (
        <>
          <div className="flex flex-1 items-center justify-center px-10">
            <img src={logoHorizontal} alt="Roblox" draggable={false} className="w-44" />
          </div>
          <p className="pb-10 text-center text-sm text-[var(--color-sms-texto-suave)]">
            Cargando
            <span className="animate-pulse"> ...</span>
          </p>
        </>
      )}
    </div>
  );
}
