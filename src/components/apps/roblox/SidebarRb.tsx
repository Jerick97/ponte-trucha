/**
 * Menu lateral de Roblox (hamburguesa): perfil del jugador, saldo de
 * Robux y la lista de secciones, como la captura real. Solo "Mensajes"
 * navega (lleva a Equipo); el resto es decorativo.
 */

import {
  Backpack,
  ChevronRight,
  Gift,
  Globe,
  GraduationCap,
  Hammer,
  Hexagon,
  Mail,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useArrastreScroll } from '../../telefono/useArrastreScroll';
import { JUGADOR_RB } from './datosMock';
import { AvatarRb } from './AvatarRb';

interface Props {
  /** Badge "1" en Mensajes mientras el escenario espera. */
  sinLeer: boolean;
  onIrMensajes: () => void;
  onCerrar: () => void;
}

const SECCIONES: { icono: LucideIcon; nombre: string }[] = [
  { icono: Users, nombre: 'Amigos' },
  { icono: Globe, nombre: 'Comunidades' },
  { icono: Backpack, nombre: 'Inventario' },
];

const SECCIONES_ABAJO: { icono: LucideIcon; nombre: string }[] = [
  { icono: Gift, nombre: 'Comprar tarjetas regalo' },
  { icono: Settings, nombre: 'Configuración' },
  { icono: Shield, nombre: 'Ayuda y seguridad' },
  { icono: GraduationCap, nombre: 'Aprende' },
  { icono: Hammer, nombre: 'Crear' },
];

export function SidebarRb({ sinLeer, onIrMensajes, onCerrar }: Props) {
  const arrastre = useArrastreScroll();

  return (
    <div className="absolute inset-0 z-20 flex">
      <div
        ref={arrastre.contenedor}
        className="sin-scrollbar h-full w-64 touch-pan-y overflow-y-auto bg-[var(--color-rb-fondo)] px-4 pb-6 pt-12 text-[var(--color-rb-texto)]"
        onPointerDown={arrastre.alPresionar}
        onPointerMove={arrastre.alMover}
        onPointerUp={arrastre.alSoltar}
        onPointerCancel={arrastre.alSoltar}
        onClickCapture={arrastre.alCapturarClick}
      >
        <div className="flex items-center gap-2 pb-3">
          <AvatarRb avatar={JUGADOR_RB.avatar} clase="h-12 w-12" />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-bold">{JUGADOR_RB.nombre}</span>
            <span className="block truncate text-xs text-[var(--color-rb-texto-suave)]">@{JUGADOR_RB.usuario}</span>
          </span>
          <span className="ml-auto rounded-full bg-[var(--color-rb-superficie)] px-2 py-1 text-[10px] text-[var(--color-rb-texto-suave)]">
            Sin verificar
          </span>
        </div>

        <div aria-hidden="true" className="mb-3 flex items-center gap-2 rounded-xl bg-[var(--color-rb-superficie)] p-3">
          <Hexagon className="h-5 w-5" />
          <span className="text-[15px] font-bold">0</span>
          <span className="ml-auto rounded-lg bg-[var(--color-rb-superficie-alta)] px-3 py-1.5 text-xs font-semibold">
            Comprar Robux
          </span>
        </div>

        <ul>
          {SECCIONES.map(({ icono: Icono, nombre }) => (
            <li key={nombre} aria-hidden="true" className="flex items-center gap-3 py-2.5 text-[15px]">
              <Icono className="h-5 w-5" />
              {nombre}
            </li>
          ))}
          <li>
            <button type="button" onClick={onIrMensajes} className="flex w-full items-center gap-3 py-2.5 text-left text-[15px]">
              <Mail aria-hidden="true" className="h-5 w-5" />
              Mensajes
              {sinLeer && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-rb-azul)] px-1.5 text-[11px] font-bold text-white">
                  1<span className="sr-only"> mensaje sin leer</span>
                </span>
              )}
            </button>
          </li>
          {SECCIONES_ABAJO.map(({ icono: Icono, nombre }) => (
            <li key={nombre} aria-hidden="true" className="flex items-center gap-3 py-2.5 text-[15px]">
              <Icono className="h-5 w-5" />
              {nombre}
              {nombre === 'Configuración' && <ChevronRight className="ml-auto h-4 w-4 text-[var(--color-rb-texto-suave)]" />}
            </li>
          ))}
        </ul>

        <span aria-hidden="true" className="mt-3 block rounded-full bg-[var(--color-rb-superficie-alta)] py-2.5 text-center text-sm font-semibold">
          Cambiar cuentas
        </span>
      </div>

      <button type="button" aria-label="Cerrar menú" onClick={onCerrar} className="h-full flex-1 bg-black/60" />
    </div>
  );
}
