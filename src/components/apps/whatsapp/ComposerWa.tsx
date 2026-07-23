/**
 * Barra de escritura de WhatsApp: emoji + campo "Mensaje" + clip + camara
 * y el boton verde (microfono, que se vuelve enviar cuando hay texto).
 * Al enfocar el campo aparece el teclado simulado, como en la referencia.
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Camera, Mic, Paperclip, SendHorizontal, Smile } from 'lucide-react';
import { Teclado } from '../Teclado';

interface Props {
  /** Solo en la fase de chat se puede escribir de verdad. */
  habilitado: boolean;
  cargando?: boolean;
  onEnviar: (texto: string) => void;
}

export function ComposerWa({ habilitado, cargando = false, onEnviar }: Props) {
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
    <div className="bg-transparent">
      <form onSubmit={enviar} className="flex items-center gap-2 px-2 pb-2 pt-1">
        <div className="flex min-h-12 flex-1 items-center gap-2 rounded-full bg-[var(--color-wa-superficie)] px-3 text-[var(--color-wa-texto-suave)]">
          <Smile aria-hidden="true" className="h-6 w-6 shrink-0" />
          <label className="sr-only" htmlFor="mensaje-wa">
            Mensaje
          </label>
          <input
            id="mensaje-wa"
            value={borrador}
            maxLength={120}
            placeholder="Mensaje"
            autoComplete="off"
            disabled={!habilitado}
            onChange={(e) => setBorrador(e.target.value)}
            onFocus={() => setConTeclado(true)}
            onBlur={() => setConTeclado(false)}
            className="min-w-0 flex-1 bg-transparent text-[16px] text-[var(--color-wa-texto)] outline-none placeholder:text-[var(--color-wa-texto-suave)]"
          />
          <Paperclip aria-hidden="true" className="h-5 w-5 shrink-0" />
          <Camera aria-hidden="true" className="h-5 w-5 shrink-0" />
        </div>
        <button
          type="submit"
          aria-label={borrador.trim() ? 'Enviar mensaje' : 'Mensaje de voz (decorativo)'}
          disabled={!habilitado || cargando}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-wa-verde)] text-[var(--color-wa-fondo)] disabled:opacity-80"
        >
          {borrador.trim() ? <SendHorizontal className="h-5 w-5" /> : <Mic className="h-6 w-6" />}
        </button>
      </form>

      {habilitado && conTeclado && (
        <Teclado
          claseAcento="text-[var(--color-wa-verde)]"
          onTexto={(texto) => setBorrador((previo) => (previo + texto).slice(0, 120))}
          onBorrar={() => setBorrador((previo) => previo.slice(0, -1))}
          onEnviar={enviar}
          onOcultar={() => setConTeclado(false)}
        />
      )}
    </div>
  );
}
