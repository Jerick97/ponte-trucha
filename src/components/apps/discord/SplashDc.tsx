/**
 * Pantalla de carga de Discord: fondo carbon con el logo blanco al centro,
 * igual que al abrir la app real. Dura un instante y pasa a la app.
 */

import { StatusBar } from '../../telefono/StatusBar';
import { LogoDiscord } from './LogoDiscord';

export function SplashDc() {
  return (
    <div className="flex h-full flex-col bg-[var(--color-dc-fondo)]" aria-label="Cargando Discord">
      <StatusBar claro />
      <div className="flex flex-1 items-center justify-center">
        <LogoDiscord className="h-24 w-24 text-[var(--color-dc-texto)]" />
      </div>
    </div>
  );
}
