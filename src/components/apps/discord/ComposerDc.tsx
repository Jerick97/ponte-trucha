/**
 * Barra de escritura de Discord: mas (+), juegos, regalo, campo redondeado
 * "Mensaje @nombre" con emoji, y microfono que se vuelve enviar cuando hay
 * texto. Al enfocar el campo aparece el teclado simulado compartido.
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Gamepad2, Gift, Mic, Plus, SendHorizontal, Smile } from 'lucide-react';
import { Teclado } from '../Teclado';

interface Props {
  /** Nombre del contacto para el placeholder "Mensaje @...". */
  destinatario: string;
  /** Solo en la fase de chat se puede escribir de verdad. */
  habilitado: boolean;
  cargando?: boolean;
  onEnviar: (texto: string) => void;
}

const CLASE_ICONO =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-dc-superficie)] text-[var(--color-dc-texto-suave)]';

export function ComposerDc({ destinatario, habilitado, cargando = false, onEnviar }: Props) {
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
    <div className="bg-[var(--color-dc-fondo)]">
      <form onSubmit={enviar} className="flex items-center gap-1.5 px-2 pb-2 pt-1">
        <span aria-hidden="true" className={CLASE_ICONO}>
          <Plus className="h-5 w-5" />
        </span>
        <span aria-hidden="true" className={CLASE_ICONO}>
          <Gamepad2 className="h-5 w-5" />
        </span>
        <span aria-hidden="true" className={CLASE_ICONO}>
          <Gift className="h-5 w-5" />
        </span>
        <div className="flex min-h-10 min-w-0 flex-1 items-center gap-1 rounded-full bg-[var(--color-dc-superficie)] px-3">
          <label className="sr-only" htmlFor="mensaje-dc">
            Mensaje
          </label>
          <input
            id="mensaje-dc"
            value={borrador}
            maxLength={120}
            placeholder={`Mensaje @${destinatario}`}
            autoComplete="off"
            disabled={!habilitado}
            onChange={(e) => setBorrador(e.target.value)}
            onFocus={() => setConTeclado(true)}
            onBlur={() => setConTeclado(false)}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--color-dc-texto)] outline-none placeholder:text-[var(--color-dc-texto-suave)]"
          />
          <Smile aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--color-dc-texto-suave)]" />
        </div>
        <button
          type="submit"
          aria-label={borrador.trim() ? 'Enviar mensaje' : 'Mensaje de voz (decorativo)'}
          disabled={!habilitado || cargando}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            borrador.trim()
              ? 'bg-[var(--color-dc-blurple)] text-white'
              : 'bg-[var(--color-dc-superficie)] text-[var(--color-dc-texto-suave)]'
          } disabled:opacity-80`}
        >
          {borrador.trim() ? <SendHorizontal className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
      </form>

      {habilitado && conTeclado && (
        <Teclado
          claseAcento="text-[var(--color-dc-blurple)]"
          onTexto={(texto) => setBorrador((previo) => (previo + texto).slice(0, 120))}
          onBorrar={() => setBorrador((previo) => previo.slice(0, -1))}
          onEnviar={enviar}
          onOcultar={() => setConTeclado(false)}
        />
      )}
    </div>
  );
}
