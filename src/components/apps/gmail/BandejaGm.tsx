/**
 * Bandeja Principal de Gmail: buscador con hamburguesa y avatar de la
 * cuenta, tarjetitas de categorias, el correo del escenario primero (en
 * negrita, sin leer) y los de relleno, con el FAB Redactar flotando.
 */

import { Info, Menu, Pencil, Tag } from 'lucide-react';
import type { Escenario } from '../../../types/escenario';
import { StatusBar } from '../../telefono/StatusBar';
import { useArrastreScroll } from '../../telefono/useArrastreScroll';
import { AvatarGm } from './AvatarGm';
import { FilaCorreoGm } from './FilaCorreoGm';
import { BarraInferiorGm } from './BarraInferiorGm';
import {
  asuntoDe,
  claseAvatarRemitente,
  CATEGORIAS_GM,
  CORREOS_GM,
  CUENTA_GM,
} from './datosMock';

interface Props {
  /** Escenario activo en este canal; null si no hay correo pendiente. */
  escenario: Escenario | null;
  /** true mientras el correo del escenario sigue sin abrirse. */
  sinLeer: boolean;
  onAbrirEscenario: () => void;
  onAbrirDrawer: () => void;
  onIrMeet: () => void;
}

export function BandejaGm({ escenario, sinLeer, onAbrirEscenario, onAbrirDrawer, onIrMeet }: Props) {
  const arrastre = useArrastreScroll();

  return (
    <div className="flex h-full flex-col bg-[var(--color-gm-fondo)] text-[var(--color-gm-texto)]">
      <StatusBar claro={false} />

      <header className="px-4 pb-2 pt-1">
        <div className="flex h-12 items-center gap-3 rounded-full bg-[var(--color-gm-superficie)] px-3">
          <button
            type="button"
            aria-label="Abrir el menú de Gmail"
            onClick={onAbrirDrawer}
            className="flex h-9 w-9 items-center justify-center"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="flex-1 text-[16px] text-[var(--color-gm-texto-suave)]">Buscar en el correo</span>
          <span
            aria-hidden="true"
            className={`flex h-8 w-8 items-center justify-center rounded-full ${CUENTA_GM.claseAvatar} text-sm font-medium text-white`}
          >
            {CUENTA_GM.inicial}
          </span>
        </div>
      </header>

      <div
        ref={arrastre.contenedor}
        className="sin-scrollbar relative min-h-0 flex-1 touch-pan-y overflow-y-auto pb-4"
        onPointerDown={arrastre.alPresionar}
        onPointerMove={arrastre.alMover}
        onPointerUp={arrastre.alSoltar}
        onPointerCancel={arrastre.alSoltar}
        onClickCapture={arrastre.alCapturarClick}
      >
        <p className="px-4 pb-1 text-xs text-[var(--color-gm-texto-suave)]">Principal</p>

        {/* Tarjetitas de categorias: decorativas, solo dan realismo */}
        {CATEGORIAS_GM.map((categoria) => (
          <div key={categoria.id} aria-hidden="true" className="flex items-center gap-4 px-4 py-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center">
              {categoria.id === 'notificaciones' ? (
                <Info className="h-6 w-6 text-[var(--color-gm-avatar-naranja)]" />
              ) : (
                <Tag className="h-6 w-6 text-[var(--color-gm-verde)]" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold">{categoria.nombre}</span>
              <span className="block truncate text-sm text-[var(--color-gm-texto-suave)]">
                {categoria.vistaPrevia}
              </span>
            </span>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                categoria.id === 'notificaciones'
                  ? 'bg-[var(--color-gm-avatar-naranja)]/20 text-[var(--color-gm-naranja)]'
                  : 'bg-[var(--color-gm-verde)]/15 text-[var(--color-gm-verde)]'
              }`}
            >
              {categoria.etiqueta}
            </span>
          </div>
        ))}

        {escenario && (
          <FilaCorreoGm
            avatar={
              <AvatarGm
                avatar={escenario.remitente.avatar}
                nombre={escenario.remitente.nombre}
                claseColor={claseAvatarRemitente(escenario.remitente.nombre)}
              />
            }
            remitente={escenario.remitente.nombre}
            asunto={asuntoDe(escenario.mensaje)}
            vistaPrevia={escenario.mensaje}
            fecha="9:41"
            sinLeer={sinLeer}
            onAbrir={onAbrirEscenario}
          />
        )}

        {CORREOS_GM.map((correo) => (
          <FilaCorreoGm
            key={correo.id}
            avatar={<AvatarGm nombre={correo.remitente} claseColor={correo.claseAvatar} />}
            remitente={correo.remitente}
            asunto={correo.asunto}
            vistaPrevia={correo.vistaPrevia}
            fecha={correo.fecha}
          />
        ))}
      </div>

      {/* FAB Redactar: decorativo, flota sobre la lista */}
      <span
        aria-hidden="true"
        className="absolute bottom-24 right-4 flex h-14 items-center gap-2 rounded-2xl bg-[var(--color-gm-fab)] px-4 font-semibold text-[var(--color-gm-texto)] shadow-lg"
      >
        <Pencil className="h-4 w-4" />
        Redactar
      </span>

      <BarraInferiorGm activa="correo" onIrCorreo={() => undefined} onIrMeet={onIrMeet} />
    </div>
  );
}
