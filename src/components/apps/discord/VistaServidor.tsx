/**
 * Vista de un servidor de Discord: rail a la izquierda y panel con nombre
 * del servidor, buscador, "Explorar canales", categorias y canales, como
 * en la referencia. Todo decorativo: el escenario vive en los DMs.
 */

import {
  ChevronDown,
  ChevronRight,
  Hash,
  Search,
  Settings,
  TextSearch,
  UserPlus,
  Volume2,
} from 'lucide-react';
import { StatusBar } from '../../telefono/StatusBar';
import { useArrastreScroll } from '../../telefono/useArrastreScroll';
import { RailServidores } from './RailServidores';
import { PieUsuario } from './PieUsuario';
import { CATEGORIAS_MOCK } from './datosMock';

interface Props {
  dmsSinLeer: number;
  onIrMensajes: () => void;
  onAbrirPerfil: () => void;
}

export function VistaServidor({ dmsSinLeer, onIrMensajes, onAbrirPerfil }: Props) {
  const arrastre = useArrastreScroll();

  return (
    <div className="flex h-full flex-col bg-[var(--color-dc-rail)] text-[var(--color-dc-texto)]">
      <StatusBar claro />
      <div className="flex min-h-0 flex-1">
        <RailServidores vista="servidor" dmsSinLeer={dmsSinLeer} onIrMensajes={onIrMensajes} onIrServidor={() => {}} />

        <div className="flex min-w-0 flex-1 flex-col rounded-tl-2xl bg-[var(--color-dc-fondo)]">
          <header className="px-4 pb-2 pt-3">
            <div className="flex items-center gap-1.5">
              <h1 className="truncate text-xl font-extrabold">Club de Juegos</h1>
              <Settings aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--color-dc-texto-suave)]" />
              <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--color-dc-texto-suave)]" />
            </div>
            <p className="text-xs text-[var(--color-dc-texto-suave)]">128 miembros · Comunidad</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex h-9 flex-1 items-center gap-2 rounded-full bg-[var(--color-dc-superficie)] px-3 text-[var(--color-dc-texto-suave)]"
              >
                <Search className="h-4 w-4" />
                <span className="text-sm">Buscar</span>
              </span>
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-dc-superficie)] text-[var(--color-dc-texto)]"
              >
                <UserPlus className="h-4 w-4" />
              </span>
            </div>
          </header>

          <div
            ref={arrastre.contenedor}
            className="sin-scrollbar min-h-0 flex-1 touch-pan-y overflow-y-auto px-2 pb-2"
            onPointerDown={arrastre.alPresionar}
            onPointerMove={arrastre.alMover}
            onPointerUp={arrastre.alSoltar}
            onPointerCancel={arrastre.alSoltar}
            onClickCapture={arrastre.alCapturarClick}
          >
            <div aria-hidden="true" className="flex items-center gap-3 rounded-lg px-2 py-2 text-[var(--color-dc-texto-suave)]">
              <TextSearch className="h-5 w-5" />
              <span className="text-[15px]">Explorar canales</span>
            </div>
            <div aria-hidden="true" className="flex items-center gap-3 rounded-lg px-2 py-2 text-[var(--color-dc-texto-suave)]">
              <Volume2 className="h-5 w-5" />
              <span className="text-[15px]">General</span>
            </div>

            {CATEGORIAS_MOCK.map((categoria) => (
              <div key={categoria.nombre} className="mt-2">
                <p
                  aria-hidden="true"
                  className="flex items-center gap-1 px-1 py-1.5 text-xs font-bold tracking-wide text-[var(--color-dc-texto-suave)]"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                  {categoria.nombre}
                </p>
                {categoria.canales.map((canal) => (
                  <div
                    key={canal.id}
                    aria-hidden="true"
                    className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 ${
                      canal.noLeidos ? 'font-semibold text-[var(--color-dc-texto)]' : 'text-[var(--color-dc-texto-suave)]'
                    }`}
                  >
                    {canal.esVoz ? <Volume2 className="h-5 w-5 shrink-0" /> : <Hash className="h-5 w-5 shrink-0" />}
                    <span className="min-w-0 flex-1 truncate text-[15px]">{canal.nombre}</span>
                    {!!canal.noLeidos && (
                      <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[var(--color-dc-rojo)] px-1 text-[10px] font-bold text-white">
                        {canal.noLeidos}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <PieUsuario onAbrirPerfil={onAbrirPerfil} />
        </div>
      </div>
    </div>
  );
}
