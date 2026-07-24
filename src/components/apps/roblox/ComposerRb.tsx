/**
 * Barra de escritura del chat de Roblox: campo redondeado "Escribe un
 * mensaje" que muestra la flecha azul cuando hay texto. Al enfocar
 * aparece el teclado compartido con el acento azul de la marca.
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowUp } from 'lucide-react';
import { Teclado } from '../Teclado';

interface Props {
  /** Solo en la fase de chat se puede escribir de verdad. */
  habilitado: boolean;
  cargando?: boolean;
  onEnviar: (texto: string) => void;
}

export function ComposerRb({ habilitado, cargando = false, onEnviar }: Props) {
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
    <div className="bg-[var(--color-rb-fondo)]">
      <form onSubmit={enviar} className="flex items-center gap-2 px-3 pb-2 pt-1">
        <div className="flex min-h-10 min-w-0 flex-1 items-center gap-1 rounded-full bg-[var(--color-rb-superficie)] px-4">
          <label className="sr-only" htmlFor="mensaje-rb">
            Escribe un mensaje
          </label>
          <input
            id="mensaje-rb"
            value={borrador}
            maxLength={120}
            placeholder="Escribe un mensaje"
            autoComplete="off"
            disabled={!habilitado}
            onChange={(e) => setBorrador(e.target.value)}
            onFocus={() => setConTeclado(true)}
            onBlur={() => setConTeclado(false)}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--color-rb-texto)] outline-none placeholder:text-[var(--color-rb-texto-suave)]"
          />
          {borrador.trim() && (
            <button
              type="submit"
              aria-label="Enviar mensaje"
              disabled={!habilitado || cargando}
              className="-mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-rb-azul)] text-white disabled:opacity-80"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {habilitado && conTeclado && (
        <Teclado
          claseAcento="text-[var(--color-rb-azul)]"
          onTexto={(texto) => setBorrador((previo) => (previo + texto).slice(0, 120))}
          onBorrar={() => setBorrador((previo) => previo.slice(0, -1))}
          onEnviar={enviar}
          onOcultar={() => setConTeclado(false)}
        />
      )}
    </div>
  );
}
