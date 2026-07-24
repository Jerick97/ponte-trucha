/**
 * Teclado oscuro del sistema, compartido por las apps del simulador
 * (aparece al escribir, como en las referencias). Las teclas insertan de
 * verdad: el nino puede escribir con el mouse o con su teclado fisico.
 */

import { useState } from 'react';
import type { PointerEvent } from 'react';
import { ArrowBigUp, ChevronDown, CornerDownLeft, Delete } from 'lucide-react';

const FILA_NUMEROS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const FILAS_LETRAS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

interface Props {
  onTexto: (texto: string) => void;
  onBorrar: () => void;
  onEnviar: () => void;
  onOcultar: () => void;
  /** Color de acento de la app (tecla mayusculas activa). */
  claseAcento?: string;
}

const CLASE_TECLA =
  'flex h-10 flex-1 items-center justify-center rounded-md bg-[var(--color-teclado-tecla)] text-[15px] text-[var(--color-teclado-texto)] active:bg-[var(--color-teclado-fondo)]';

export function Teclado({ onTexto, onBorrar, onEnviar, onOcultar, claseAcento = 'text-[var(--color-teclado-texto)]' }: Props) {
  const [mayus, setMayus] = useState(false);

  // pointerdown + preventDefault: la tecla no le roba el foco al input.
  const sinFoco = (evento: PointerEvent) => evento.preventDefault();
  const tecla = (letra: string) => {
    onTexto(mayus ? letra.toUpperCase() : letra);
    setMayus(false);
  };

  return (
    <div className="bg-[var(--color-teclado-fondo)] px-1.5 pb-2 pt-1.5" aria-label="Teclado simulado">
      <div className="mb-1 flex justify-end px-1">
        <button type="button" aria-label="Ocultar teclado" onPointerDown={sinFoco} onClick={onOcultar} className="flex h-8 w-10 items-center justify-center text-[var(--color-teclado-texto-suave)]">
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
      <div className="mb-1.5 flex gap-1">
        {FILA_NUMEROS.map((n) => (
          <button key={n} type="button" onPointerDown={sinFoco} onClick={() => tecla(n)} className={CLASE_TECLA}>
            {n}
          </button>
        ))}
      </div>
      {FILAS_LETRAS.map((fila, i) => (
        <div key={i} className="mb-1.5 flex gap-1">
          {i === 2 && (
            <button type="button" aria-label="Mayusculas" aria-pressed={mayus} onPointerDown={sinFoco} onClick={() => setMayus(!mayus)} className={`${CLASE_TECLA} max-w-12 ${mayus ? claseAcento : ''}`}>
              <ArrowBigUp className="h-5 w-5" />
            </button>
          )}
          {fila.map((letra) => (
            <button key={letra} type="button" onPointerDown={sinFoco} onClick={() => tecla(letra)} className={CLASE_TECLA}>
              {mayus ? letra.toUpperCase() : letra}
            </button>
          ))}
          {i === 2 && (
            <button type="button" aria-label="Borrar" onPointerDown={sinFoco} onClick={onBorrar} className={`${CLASE_TECLA} max-w-12`}>
              <Delete className="h-5 w-5" />
            </button>
          )}
        </div>
      ))}
      <div className="flex gap-1">
        <button type="button" onPointerDown={sinFoco} onClick={() => onTexto(',')} className={`${CLASE_TECLA} max-w-12`}>
          ,
        </button>
        <button type="button" aria-label="Espacio" onPointerDown={sinFoco} onClick={() => onTexto(' ')} className={`${CLASE_TECLA} text-xs text-[var(--color-teclado-texto-suave)]`}>
          Español (US)
        </button>
        <button type="button" onPointerDown={sinFoco} onClick={() => onTexto('.')} className={`${CLASE_TECLA} max-w-12`}>
          .
        </button>
        <button type="button" aria-label="Enviar" onPointerDown={sinFoco} onClick={onEnviar} className={`${CLASE_TECLA} max-w-12`}>
          <CornerDownLeft className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
