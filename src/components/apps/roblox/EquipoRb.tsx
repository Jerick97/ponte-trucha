/**
 * Vista Equipo (Party) de Roblox: la lista de chats, replicada de la
 * referencia oficial. El hilo del escenario aparece primero y sin leer;
 * los amigos del mock rellenan la lista.
 */

import { Bell, Globe, ChevronRight, Plus, Search } from 'lucide-react';
import type { Escenario } from '../../../types/escenario';
import { StatusBar } from '../../telefono/StatusBar';
import { useArrastreScroll } from '../../telefono/useArrastreScroll';
import { AMIGOS_RB, avatarRemitente } from './datosMock';
import { BarraNavRb } from './BarraNavRb';
import { FilaChatRb } from './FilaChatRb';

interface Props {
  escenario: Escenario | null;
  sinLeer: boolean;
  onAbrirEscenario: () => void;
  onIrInicio: () => void;
}

export function EquipoRb({ escenario, sinLeer, onAbrirEscenario, onIrInicio }: Props) {
  const arrastre = useArrastreScroll();

  return (
    <div className="flex h-full flex-col bg-[var(--color-rb-fondo)] text-[var(--color-rb-texto)]">
      <StatusBar claro />

      <header className="flex items-center px-4 py-2">
        <h1 className="text-[26px] font-bold">Equipo</h1>
        <span aria-hidden="true" className="ml-auto flex items-center gap-4">
          <Search className="h-5 w-5" />
          <Plus className="h-5 w-5" />
          <Bell className="h-5 w-5" />
        </span>
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
        {/* Fila de Comunidades, como en la app real */}
        <div aria-hidden="true" className="flex items-center gap-3 px-4 py-2">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-rb-superficie)]">
            <Globe className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold">Comunidades</span>
            <span className="block truncate text-sm text-[var(--color-rb-texto-suave)]">Novedades de los Robloxians</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-[var(--color-rb-texto-suave)]" />
        </div>

        {escenario && (
          <FilaChatRb
            nombre={escenario.remitente.nombre}
            avatar={avatarRemitente(escenario.remitente.nombre)}
            vistaPrevia={escenario.mensaje}
            hora="ahora"
            enLinea
            sinLeer={sinLeer}
            onAbrir={onAbrirEscenario}
          />
        )}

        {AMIGOS_RB.map((amigo) => (
          <FilaChatRb
            key={amigo.id}
            nombre={amigo.nombre}
            avatar={amigo.avatar}
            vistaPrevia={amigo.vistaPrevia}
            hora={amigo.hora}
            enLinea={amigo.enLinea}
          />
        ))}
      </div>

      <BarraNavRb activa="equipo" onIrInicio={onIrInicio} onIrEquipo={() => {}} sinLeerEquipo={false} />
    </div>
  );
}
