/**
 * Pildora "Responder" del pie del correo abierto: decorativa fuera del
 * chat y campo de texto real cuando el nino le responde al estafador.
 */

import { useState } from 'react';
import { ChevronDown, Forward, Paperclip, Reply, SendHorizontal, Smile } from 'lucide-react';

interface Props {
  habilitado: boolean;
  cargando: boolean;
  onEnviar: (texto: string) => void;
}

export function ComposerGm({ habilitado, cargando, onEnviar }: Props) {
  const [texto, setTexto] = useState('');

  const enviar = () => {
    const limpio = texto.trim();
    if (!limpio || !habilitado || cargando) return;
    onEnviar(limpio);
    setTexto('');
  };

  return (
    <div className="flex shrink-0 items-center gap-2 px-3 pb-3 pt-1">
      <Paperclip aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--color-gm-texto-suave)]" />
      <div className="flex h-12 min-w-0 flex-1 items-center gap-1.5 rounded-full bg-[var(--color-gm-superficie)] px-3">
        <Reply aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--color-gm-texto)]" />
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--color-gm-texto)]" />
        {habilitado ? (
          <input
            id="mensaje-gm"
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && enviar()}
            placeholder="Responder"
            aria-label="Escribe tu respuesta"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--color-gm-texto)] outline-none placeholder:text-[var(--color-gm-texto-suave)]"
          />
        ) : (
          <span aria-hidden="true" className="flex-1 text-[15px] text-[var(--color-gm-texto-suave)]">
            Responder
          </span>
        )}
        {habilitado && texto.trim() ? (
          <button
            type="button"
            aria-label="Enviar respuesta"
            onClick={enviar}
            disabled={cargando}
            className="flex h-8 w-8 shrink-0 items-center justify-center text-[var(--color-gm-azul)]"
          >
            <SendHorizontal className="h-5 w-5" />
          </button>
        ) : (
          <Forward aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--color-gm-texto)]" />
        )}
      </div>
      <Smile aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--color-gm-texto-suave)]" />
    </div>
  );
}
