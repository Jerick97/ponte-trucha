/**
 * El momento "wow" del demo: el nino le responde al estafador y un LLM
 * improvisa la presion, en un entorno controlado.
 *
 * Owner: Logica/LLM (Francis). La UI solo dibuja turnos y envia texto.
 */

import { useState, type FormEvent } from 'react';
import { Burbuja } from './Burbuja';
import type { TurnoChat } from '../llm';

interface Props {
  turnos: readonly TurnoChat[];
  cargando: boolean;
  /** True cuando ya se agotaron los turnos permitidos. */
  agotado: boolean;
  onEnviar: (texto: string) => void;
  onTerminar: () => void;
}

export function ChatEstafador({ turnos, cargando, agotado, onEnviar, onTerminar }: Props) {
  const [borrador, setBorrador] = useState('');

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const texto = borrador.trim();
    if (!texto || cargando || agotado) return;
    onEnviar(texto);
    setBorrador('');
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1">
        {turnos.map((turno, i) => (
          <Burbuja key={i} texto={turno.texto} propia={turno.autor === 'nino'} />
        ))}
        {cargando && (
          <p className="mb-3 text-sm text-[var(--color-texto-suave)]" aria-live="polite">
            escribiendo…
          </p>
        )}
      </div>

      {agotado ? (
        <button
          type="button"
          onClick={onTerminar}
          className="min-h-12 w-full rounded-2xl bg-[var(--color-marca-500)] px-4 text-sm font-bold text-white"
        >
          Cortar la conversación
        </button>
      ) : (
        <form onSubmit={enviar} className="flex gap-2">
          <label className="sr-only" htmlFor="respuesta-estafador">
            Tu respuesta
          </label>
          <input
            id="respuesta-estafador"
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            maxLength={120}
            placeholder="Escríbele…"
            className="min-h-12 flex-1 rounded-2xl bg-[var(--color-burbuja-entrante)] px-4 text-[15px] outline-none focus:ring-2 focus:ring-[var(--color-marca-500)]"
          />
          <button
            type="submit"
            disabled={cargando}
            className="min-h-12 rounded-2xl bg-[var(--color-marca-500)] px-4 font-bold text-white disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      )}
    </div>
  );
}
