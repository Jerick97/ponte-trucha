/**
 * Barra de escritura de Mensajes de iOS: mas (+) a la izquierda y campo
 * redondeado "Mensaje de texto · SMS" con microfono, que se vuelve flecha
 * verde de enviar cuando hay texto. Al enfocar aparece el teclado.
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowUp, Mic, Plus } from 'lucide-react';
import { Teclado } from '../Teclado';

interface Props {
  /** Solo en la fase de chat se puede escribir de verdad. */
  habilitado: boolean;
  cargando?: boolean;
  onEnviar: (texto: string) => void;
}

export function ComposerSms({ habilitado, cargando = false, onEnviar }: Props) {
  const [borrador, setBorrador] = useState('');
  const [conTeclado, setConTeclado] = useState(false);

  function enviar(evento?: FormEvent) {
    evento?.preventDefault();
    const texto = borrador.trim();
    if (!texto || !habilitado || cargando) return;
    onEnviar(texto);
    setBorrador('');
  }

  return (
    <div className="bg-[var(--color-sms-fondo)]">
      <form onSubmit={enviar} className="flex items-center gap-2 px-3 pb-2 pt-1">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-sms-superficie)] text-[var(--color-sms-texto-suave)]"
        >
          <Plus className="h-5 w-5" />
        </span>
        <div className="flex min-h-9 min-w-0 flex-1 items-center gap-1 rounded-full border border-[var(--color-sms-burbuja-entrante)] px-3">
          <label className="sr-only" htmlFor="mensaje-sms">
            Mensaje de texto
          </label>
          <input
            id="mensaje-sms"
            value={borrador}
            maxLength={120}
            placeholder="Mensaje de texto · SMS"
            autoComplete="off"
            disabled={!habilitado}
            onChange={(e) => setBorrador(e.target.value)}
            onFocus={() => setConTeclado(true)}
            onBlur={() => setConTeclado(false)}
            className="min-w-0 flex-1 bg-transparent text-[16px] text-[var(--color-sms-texto)] outline-none placeholder:text-[var(--color-sms-texto-suave)]"
          />
          {borrador.trim() ? (
            <button
              type="submit"
              aria-label="Enviar mensaje"
              disabled={!habilitado || cargando}
              className="-mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-sms-burbuja-propia)] text-white disabled:opacity-80"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          ) : (
            <Mic aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--color-sms-texto-suave)]" />
          )}
        </div>
      </form>

      {habilitado && conTeclado && (
        <Teclado
          claseAcento="text-[var(--color-sms-azul)]"
          onTexto={(texto) => setBorrador((previo) => (previo + texto).slice(0, 120))}
          onBorrar={() => setBorrador((previo) => previo.slice(0, -1))}
          onEnviar={enviar}
          onOcultar={() => setConTeclado(false)}
        />
      )}
    </div>
  );
}
