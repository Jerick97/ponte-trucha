/**
 * Pantalla principal de Mensajes de iOS 18: "Editar" y redactar arriba,
 * titulo grande, buscador con microfono y la lista de hilos (el escenario
 * primero, con su punto azul de no leido). Replica del tema claro.
 */

import { Mic, Search, SquarePen } from 'lucide-react';
import type { Escenario } from '../../../types/escenario';
import { StatusBar } from '../../telefono/StatusBar';
import { useArrastreScroll } from '../../telefono/useArrastreScroll';
import { FilaSms } from './FilaSms';
import { SMS_MOCK } from './datosMock';

interface Props {
  /** Escenario activo en este canal; null si no hay mensaje pendiente. */
  escenario: Escenario | null;
  /** true mientras el mensaje del escenario sigue sin abrirse. */
  sinLeer: boolean;
  onAbrirEscenario: () => void;
}

export function ListaSms({ escenario, sinLeer, onAbrirEscenario }: Props) {
  const arrastre = useArrastreScroll();

  return (
    <div className="flex h-full flex-col bg-[var(--color-sms-fondo)] text-[var(--color-sms-texto)]">
      <StatusBar claro={false} />

      <header className="px-4 pb-1">
        <div className="flex items-center justify-between py-1">
          <span aria-hidden="true" className="text-[17px] text-[var(--color-sms-azul)]">
            Editar
          </span>
          <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center text-[var(--color-sms-azul)]">
            <SquarePen className="h-5 w-5" />
          </span>
        </div>
        <h1 className="text-[32px] font-bold leading-tight">Mensajes</h1>
        <div className="mt-2 flex h-9 items-center gap-2 rounded-xl bg-[var(--color-sms-superficie)] px-2.5 text-[var(--color-sms-texto-suave)]">
          <Search aria-hidden="true" className="h-4 w-4" />
          <span className="flex-1 text-[16px]">Buscar</span>
          <Mic aria-hidden="true" className="h-4 w-4" />
        </div>
      </header>

      <div
        ref={arrastre.contenedor}
        className="sin-scrollbar min-h-0 flex-1 touch-pan-y overflow-y-auto pb-4 pt-1"
        onPointerDown={arrastre.alPresionar}
        onPointerMove={arrastre.alMover}
        onPointerUp={arrastre.alSoltar}
        onPointerCancel={arrastre.alSoltar}
        onClickCapture={arrastre.alCapturarClick}
      >
        {escenario && (
          <FilaSms
            nombre={escenario.remitente.nombre}
            vistaPrevia={escenario.mensaje}
            hora="ahora"
            avatar={escenario.remitente.avatar}
            sinLeer={sinLeer}
            onAbrir={onAbrirEscenario}
          />
        )}
        {SMS_MOCK.map((sms) => (
          <FilaSms key={sms.id} {...sms} />
        ))}
      </div>
    </div>
  );
}
