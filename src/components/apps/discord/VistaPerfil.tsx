/**
 * Perfil del jugador en Discord: banner celeste, avatar, "Editar perfil",
 * pestañas y tarjetas (Potencia tu perfil, Orbs, Informacion), como en la
 * referencia. Todo decorativo salvo el boton de cerrar.
 */

import { Gift, Hash, Pencil, RefreshCw, Settings, Store, X, Zap } from 'lucide-react';
import { StatusBar } from '../../telefono/StatusBar';
import { useArrastreScroll } from '../../telefono/useArrastreScroll';
import { AvatarDc } from './AvatarDc';
import { JUGADOR } from './datosMock';

interface Props {
  onCerrar: () => void;
}

const CLASE_ICONO_HEADER =
  'flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-dc-fondo)]/50 text-[var(--color-dc-texto)]';

export function VistaPerfil({ onCerrar }: Props) {
  const arrastre = useArrastreScroll();

  return (
    <div className="flex h-full flex-col bg-[var(--color-dc-fondo)] text-[var(--color-dc-texto)]">
      {/* Banner celeste con la status bar encima, como en la referencia */}
      <div className="bg-[var(--color-dc-celeste)]">
        <StatusBar claro />
        <div className="flex items-center justify-between px-3 pb-10 pt-1">
          <button
            type="button"
            aria-label="Cerrar perfil"
            onClick={onCerrar}
            className="flex h-9 items-center gap-1.5 rounded-full bg-[var(--color-dc-fondo)]/50 px-3 text-[var(--color-dc-texto)]"
          >
            <X className="h-5 w-5" />
            <span className="text-xs font-bold">14k</span>
          </button>
          <span aria-hidden="true" className="flex items-center gap-2">
            <span className={CLASE_ICONO_HEADER}>
              <RefreshCw className="h-4 w-4" />
            </span>
            <span className={CLASE_ICONO_HEADER}>
              <Store className="h-4 w-4" />
            </span>
            <span className="flex h-9 items-center gap-1 rounded-full bg-[var(--color-dc-fondo)]/50 px-3 text-sm font-semibold">
              <Zap className="h-4 w-4" />
              Nitro
            </span>
            <span className={CLASE_ICONO_HEADER}>
              <Settings className="h-4 w-4" />
            </span>
          </span>
        </div>
      </div>

      {/* Avatar solapado sobre el banner: fuera del scroll para que el
          overflow no lo recorte. */}
      <div className="px-4">
        <div className="-mt-9 flex items-end gap-3">
          <span className="rounded-full border-4 border-[var(--color-dc-fondo)]">
            <AvatarDc avatar={JUGADOR.avatar} enLinea clase="h-20 w-20" claseEmoji="text-4xl" />
          </span>
          <span
            aria-hidden="true"
            className="mb-2 rounded-full bg-[var(--color-dc-superficie)] px-3 py-1.5 text-sm italic text-[var(--color-dc-texto-suave)]"
          >
            🎮 ¡Aprendiendo a no caer!
          </span>
        </div>
      </div>

      <div
        ref={arrastre.contenedor}
        className="sin-scrollbar min-h-0 flex-1 touch-pan-y overflow-y-auto pb-6"
        onPointerDown={arrastre.alPresionar}
        onPointerMove={arrastre.alMover}
        onPointerUp={arrastre.alSoltar}
        onPointerCancel={arrastre.alSoltar}
        onClickCapture={arrastre.alCapturarClick}
      >
        <div className="px-4">
          <h1 className="mt-2 text-2xl font-extrabold">{JUGADOR.nombre}</h1>
          <p className="flex items-center gap-1.5 text-sm text-[var(--color-dc-texto-suave)]">
            {JUGADOR.usuario}
            <span
              aria-hidden="true"
              className="flex items-center gap-1 rounded-md bg-[var(--color-dc-superficie)] px-1.5 py-0.5 text-xs font-bold text-[var(--color-dc-texto)]"
            >
              <Zap className="h-3 w-3 text-[var(--color-dc-celeste)]" />
              TRUCHA
            </span>
            <span
              aria-hidden="true"
              className="flex items-center rounded-md bg-[var(--color-dc-superficie)] px-1.5 py-0.5"
            >
              <Hash className="h-3 w-3" />
            </span>
          </p>

          <span
            aria-hidden="true"
            className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-dc-blurple)] text-[15px] font-semibold text-white"
          >
            <Pencil className="h-4 w-4" />
            Editar perfil
          </span>

          <div aria-hidden="true" className="mt-4 flex border-b border-[var(--color-dc-superficie)] text-[15px]">
            <span className="flex-1 border-b-2 border-[var(--color-dc-blurple)] pb-2 text-center font-semibold">
              Principal
            </span>
            <span className="flex-1 pb-2 text-center text-[var(--color-dc-texto-suave)]">Lista de deseados</span>
          </div>

          <div aria-hidden="true" className="mt-4 rounded-2xl border-2 border-[var(--color-dc-blurple)] p-4">
            <p className="mb-3 flex items-center justify-between font-bold">
              Potencia tu perfil
              <X className="h-4 w-4 text-[var(--color-dc-texto-suave)]" />
            </p>
            <span className="flex gap-2">
              <span className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--color-dc-superficie)] py-2.5 text-sm font-semibold">
                <Zap className="h-4 w-4" />
                Obtén Nitro
              </span>
              <span className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--color-dc-superficie)] py-2.5 text-sm font-semibold">
                <Store className="h-4 w-4" />
                Tienda
              </span>
            </span>
          </div>

          <div aria-hidden="true" className="mt-3 flex items-center justify-between rounded-2xl bg-[var(--color-dc-superficie)] p-4">
            <span className="font-bold">Saldo de Orbs</span>
            <span className="flex items-center gap-2 rounded-full bg-[var(--color-dc-superficie-alta)] px-3 py-2 text-sm font-semibold">
              <Gift className="h-4 w-4" />
              Probar los Orbs
            </span>
          </div>

          <div aria-hidden="true" className="mt-3 rounded-2xl bg-[var(--color-dc-superficie)] p-4">
            <p className="mb-2 font-bold">Información</p>
            <p className="text-sm leading-relaxed text-[var(--color-dc-texto)]">
              Detective de mensajes trucha 🕵️. Si suena demasiado bueno para ser verdad, ¡es trampa!
            </p>
            <p className="mt-3 text-sm font-bold">Miembro desde</p>
            <p className="mt-1 text-sm text-[var(--color-dc-texto-suave)]">15 ago 2024</p>
          </div>
        </div>
      </div>
    </div>
  );
}
