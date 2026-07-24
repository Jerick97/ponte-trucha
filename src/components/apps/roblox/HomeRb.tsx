/**
 * Home de la app Roblox, replicado de las capturas oficiales: header con
 * hamburguesa y logo, fila del jugador, carrusel de amigos, juego
 * destacado y grilla "Recomendadas para ti" con los juegos reales.
 */

import { Bell, Hexagon, Plus, Search, ThumbsUp } from 'lucide-react';
import { StatusBar } from '../../telefono/StatusBar';
import { useArrastreScroll } from '../../telefono/useArrastreScroll';
import logoBlanco from '../../../assets/img/roblox/Roblox Dark Logo SVG.svg';
import { JUEGOS_RB, type JuegoRb } from './datosJuegos';
import { AMIGOS_RB, JUGADOR_RB } from './datosMock';
import { AvatarRb } from './AvatarRb';
import { BarraNavRb } from './BarraNavRb';

interface Props {
  sinLeer: boolean;
  onAbrirSidebar: () => void;
  onIrEquipo: () => void;
  onAbrirJuego: (juego: JuegoRb) => void;
}

export function HomeRb({ sinLeer, onAbrirSidebar, onIrEquipo, onAbrirJuego }: Props) {
  const arrastre = useArrastreScroll();
  const [destacado, ...recomendados] = JUEGOS_RB;

  return (
    <div className="flex h-full flex-col bg-[var(--color-rb-fondo)] text-[var(--color-rb-texto)]">
      <StatusBar claro />

      <header className="flex items-center gap-3 px-4 py-2">
        <button type="button" aria-label="Abrir menú" onClick={onAbrirSidebar} className="relative">
          <span aria-hidden="true" className="flex flex-col gap-1">
            <i className="block h-0.5 w-5 rounded bg-[var(--color-rb-texto)]" />
            <i className="block h-0.5 w-5 rounded bg-[var(--color-rb-texto)]" />
            <i className="block h-0.5 w-5 rounded bg-[var(--color-rb-texto)]" />
          </span>
          {sinLeer && (
            <span aria-hidden="true" className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[var(--color-rb-azul)]" />
          )}
        </button>
        <img src={logoBlanco} alt="Roblox" draggable={false} className="h-4" />
        <span aria-hidden="true" className="ml-auto flex items-center gap-4 text-[var(--color-rb-texto)]">
          <Search className="h-5 w-5" />
          <Hexagon className="h-5 w-5" />
          <Bell className="h-5 w-5" />
        </span>
      </header>

      <div
        ref={arrastre.contenedor}
        className="sin-scrollbar min-h-0 flex-1 touch-pan-y overflow-y-auto pb-4"
        onPointerDown={arrastre.alPresionar}
        onPointerMove={arrastre.alMover}
        onPointerUp={arrastre.alSoltar}
        onPointerCancel={arrastre.alSoltar}
        onClickCapture={arrastre.alCapturarClick}
      >
        <div className="flex items-center gap-2 px-4 pb-3">
          <AvatarRb avatar={JUGADOR_RB.avatar} clase="h-9 w-9" />
          <span className="text-[15px] font-semibold">{JUGADOR_RB.nombre}</span>
          <span className="rounded-full bg-[var(--color-rb-superficie)] px-2.5 py-1 text-xs text-[var(--color-rb-texto-suave)]">
            Sin verificar
          </span>
        </div>

        {/* Carrusel de amigos, como la referencia "Friends (32)" */}
        <p className="px-4 pb-2 text-[15px] font-bold">Amigos ({AMIGOS_RB.length})</p>
        <div aria-hidden="true" className="flex gap-3 overflow-hidden px-4 pb-4">
          <span className="flex w-16 shrink-0 flex-col items-center gap-1">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-rb-superficie)]">
              <Plus className="h-6 w-6 text-[var(--color-rb-texto)]" />
            </span>
            <span className="w-full truncate text-center text-xs text-[var(--color-rb-texto-suave)]">Añadir</span>
          </span>
          {AMIGOS_RB.slice(0, 4).map((amigo) => (
            <span key={amigo.id} className="flex w-16 shrink-0 flex-col items-center gap-1">
              <AvatarRb avatar={amigo.avatar} clase="h-16 w-16" enLinea={amigo.enLinea} />
              <span className="w-full truncate text-center text-xs text-[var(--color-rb-texto-suave)]">{amigo.nombre}</span>
            </span>
          ))}
        </div>

        {/* Juego destacado con banner ancho, como "Standout Games" */}
        <p className="px-4 pb-2 text-[15px] font-bold">Juegos destacados</p>
        <button
          type="button"
          onClick={() => onAbrirJuego(destacado)}
          className="mx-4 mb-4 block w-[calc(100%-2rem)] overflow-hidden rounded-xl text-left"
        >
          <img src={destacado.capturas[0]} alt="" draggable={false} className="aspect-video w-full object-cover" />
          <span className="block bg-[var(--color-rb-superficie)] px-3 py-2">
            <span className="block truncate text-sm font-semibold">{destacado.nombre}</span>
            <span className="block text-xs text-[var(--color-rb-texto-suave)]">Te damos la bienvenida</span>
          </span>
        </button>

        <p className="px-4 pb-2 text-[15px] font-bold">Recomendadas para ti</p>
        <div className="grid grid-cols-2 gap-3 px-4">
          {recomendados.map((juego) => (
            <button key={juego.id} type="button" onClick={() => onAbrirJuego(juego)} className="text-left">
              <img src={juego.icono} alt="" draggable={false} className="aspect-square w-full rounded-lg object-cover" />
              <span className="mt-1 block truncate text-sm">{juego.nombre}</span>
              <span className="flex items-center gap-1 text-xs text-[var(--color-rb-texto-suave)]">
                <ThumbsUp aria-hidden="true" className="h-3 w-3" />
                Valoración {juego.valoracion}%
              </span>
            </button>
          ))}
        </div>
      </div>

      <BarraNavRb activa="inicio" onIrInicio={() => {}} onIrEquipo={onIrEquipo} sinLeerEquipo={sinLeer} />
    </div>
  );
}
