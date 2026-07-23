/**
 * Vista Mensajes de Discord (rail con el boton de DMs en blurple): header,
 * buscador con "Añadir amigos", tarjetas de amigos activos y la lista de
 * DMs con el escenario primero, como en la referencia.
 */

import { Plus, Search, UserPlus } from 'lucide-react';
import type { Escenario } from '../../../types/escenario';
import { StatusBar } from '../../telefono/StatusBar';
import { useArrastreScroll } from '../../telefono/useArrastreScroll';
import { RailServidores } from './RailServidores';
import { PieUsuario } from './PieUsuario';
import { AvatarDc } from './AvatarDc';
import { FilaDm } from './FilaDm';
import { DMS_MOCK } from './datosMock';

interface Props {
  /** Escenario activo en este canal; null si no hay mensaje pendiente. */
  escenario: Escenario | null;
  /** true mientras el mensaje del escenario sigue sin abrirse. */
  sinLeer: boolean;
  onAbrirEscenario: () => void;
  onIrServidor: () => void;
  onAbrirPerfil: () => void;
}

export function ListaMensajes({ escenario, sinLeer, onAbrirEscenario, onIrServidor, onAbrirPerfil }: Props) {
  const arrastre = useArrastreScroll();

  return (
    <div className="flex h-full flex-col bg-[var(--color-dc-rail)] text-[var(--color-dc-texto)]">
      <StatusBar claro />
      <div className="flex min-h-0 flex-1">
        <RailServidores
          vista="mensajes"
          dmsSinLeer={sinLeer ? 1 : 0}
          onIrMensajes={() => {}}
          onIrServidor={onIrServidor}
        />

        <div className="flex min-w-0 flex-1 flex-col rounded-tl-2xl bg-[var(--color-dc-fondo)]">
          <header className="px-4 pb-2 pt-3">
            <h1 className="text-xl font-extrabold">Mensajes</h1>
            <div className="mt-2 flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-dc-superficie)] text-[var(--color-dc-texto)]"
              >
                <Search className="h-4 w-4" />
              </span>
              <span
                aria-hidden="true"
                className="flex h-9 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--color-dc-superficie)] px-3 text-[var(--color-dc-texto-suave)]"
              >
                <UserPlus className="h-4 w-4" />
                <span className="text-sm">Añadir amigos</span>
              </span>
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-dc-blurple)] text-white"
              >
                <Plus className="h-5 w-5" />
              </span>
            </div>
          </header>

          <div
            ref={arrastre.contenedor}
            className="sin-scrollbar min-h-0 flex-1 touch-pan-y overflow-y-auto pb-2"
            onPointerDown={arrastre.alPresionar}
            onPointerMove={arrastre.alMover}
            onPointerUp={arrastre.alSoltar}
            onPointerCancel={arrastre.alSoltar}
            onClickCapture={arrastre.alCapturarClick}
          >
            {/* Amigos activos ahora (tarjetas horizontales de la referencia) */}
            <div aria-hidden="true" className="flex gap-2 px-4 pb-3 pt-1">
              {DMS_MOCK.filter((dm) => dm.enLinea).map((dm) => (
                <span
                  key={dm.id}
                  className="flex w-24 flex-col items-center gap-1.5 rounded-2xl bg-[var(--color-dc-superficie)] px-2 py-3"
                >
                  <AvatarDc avatar={dm.avatar} enLinea clase="h-12 w-12" />
                  <span className="w-full truncate text-center text-xs font-semibold">{dm.nombre}</span>
                </span>
              ))}
            </div>

            {escenario && (
              <FilaDm
                nombre={escenario.remitente.nombre}
                vistaPrevia={escenario.mensaje}
                hora="ahora"
                avatar={escenario.remitente.avatar}
                noLeidos={sinLeer ? 1 : 0}
                onAbrir={onAbrirEscenario}
              />
            )}
            {DMS_MOCK.map((dm) => (
              <FilaDm key={dm.id} {...dm} />
            ))}
          </div>

          <PieUsuario onAbrirPerfil={onAbrirPerfil} />
        </div>
      </div>
    </div>
  );
}
