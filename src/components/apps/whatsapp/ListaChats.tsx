/**
 * Pantalla principal de WhatsApp: header, buscador, filtros, archivados,
 * lista de chats (el escenario primero, con no-leidos) y barra inferior.
 * Replica del tema oscuro de WhatsApp Android.
 */

import {
  Archive,
  Camera,
  CircleDashed,
  EllipsisVertical,
  MessageCircle,
  MessageSquarePlus,
  Phone,
  Search,
  Users,
} from 'lucide-react';
import type { Escenario } from '../../../types/escenario';
import { StatusBar } from '../../telefono/StatusBar';
import { useArrastreScroll } from '../../telefono/useArrastreScroll';
import { FilaChat } from './FilaChat';
import { CHATS_MOCK } from './datosMock';

const FILTROS = ['Todos', 'No leídos', 'Favoritos', 'Grupos'] as const;

interface Props {
  /** Escenario activo en este canal; null si no hay mensaje pendiente. */
  escenario: Escenario | null;
  /** true mientras el mensaje del escenario sigue sin abrirse. */
  sinLeer: boolean;
  onAbrirEscenario: () => void;
}

export function ListaChats({ escenario, sinLeer, onAbrirEscenario }: Props) {
  const arrastre = useArrastreScroll();

  return (
    <div className="flex h-full flex-col bg-[var(--color-wa-fondo)] text-[var(--color-wa-texto)]">
      <StatusBar claro />

      <header className="flex items-center justify-between px-4 pb-1 pt-2">
        <h1 className="text-2xl font-bold">WhatsApp</h1>
        <div className="flex items-center gap-1 text-[var(--color-wa-texto)]">
          <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center">
            <Camera className="h-5 w-5" />
          </span>
          <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center">
            <EllipsisVertical className="h-5 w-5" />
          </span>
        </div>
      </header>

      <div className="px-4 py-1.5">
        <div className="flex h-11 items-center gap-3 rounded-full bg-[var(--color-wa-superficie)] px-4 text-[var(--color-wa-texto-suave)]">
          <Search aria-hidden="true" className="h-5 w-5" />
          <span className="text-[15px]">Preguntar a Meta AI o buscar</span>
        </div>
      </div>

      <div aria-hidden="true" className="flex gap-2 overflow-x-hidden px-4 py-2">
        {FILTROS.map((filtro, i) => (
          <span
            key={filtro}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm ${
              i === 0
                ? 'bg-[var(--color-wa-chip-activo)] font-semibold text-[var(--color-wa-verde)]'
                : 'bg-[var(--color-wa-superficie)] text-[var(--color-wa-texto-suave)]'
            }`}
          >
            {filtro}
          </span>
        ))}
      </div>

      <div
        ref={arrastre.contenedor}
        className="sin-scrollbar relative min-h-0 flex-1 touch-pan-y overflow-y-auto"
        onPointerDown={arrastre.alPresionar}
        onPointerMove={arrastre.alMover}
        onPointerUp={arrastre.alSoltar}
        onPointerCancel={arrastre.alSoltar}
        onClickCapture={arrastre.alCapturarClick}
      >
        <div aria-hidden="true" className="flex items-center gap-3 px-4 py-3 text-[var(--color-wa-texto-suave)]">
          <span className="flex w-12 justify-center">
            <Archive className="h-5 w-5" />
          </span>
          <span className="flex-1 font-medium text-[var(--color-wa-texto)]">Archivados</span>
          <span className="text-xs font-semibold text-[var(--color-wa-badge)]">4</span>
        </div>

        {escenario && (
          <FilaChat
            nombre={escenario.remitente.nombre}
            vistaPrevia={escenario.mensaje}
            hora="ahora"
            avatar={escenario.remitente.avatar}
            noLeidos={sinLeer ? 1 : 0}
            onAbrir={onAbrirEscenario}
          />
        )}
        {CHATS_MOCK.map((chat) => (
          <FilaChat key={chat.id} {...chat} />
        ))}

        <span
          aria-hidden="true"
          className="absolute bottom-4 right-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-wa-badge)] text-[var(--color-wa-fondo)] shadow-lg"
        >
          <MessageSquarePlus className="h-6 w-6" />
        </span>
      </div>

      <nav aria-hidden="true" className="flex items-start justify-around border-t border-[var(--color-wa-superficie)] bg-[var(--color-wa-fondo)] px-2 pb-4 pt-2 text-[var(--color-wa-texto)]">
        {[
          { Icono: MessageCircle, nombre: 'Chats', activo: true },
          { Icono: CircleDashed, nombre: 'Novedades' },
          { Icono: Users, nombre: 'Comunidades' },
          { Icono: Phone, nombre: 'Llamadas' },
        ].map(({ Icono, nombre, activo }) => (
          <span key={nombre} className="flex flex-col items-center gap-1">
            <span
              className={`flex h-8 w-14 items-center justify-center rounded-full ${
                activo ? 'bg-[var(--color-wa-chip-activo)] text-[var(--color-wa-verde)]' : ''
              }`}
            >
              <Icono className="h-5 w-5" />
            </span>
            <span className={`text-xs ${activo ? 'font-bold' : ''}`}>{nombre}</span>
          </span>
        ))}
      </nav>
    </div>
  );
}
