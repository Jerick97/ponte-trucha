/**
 * Pestana Meet de Gmail: cabecera "Reunión", botones de reunion y el
 * carrusel de ilustraciones con sus dots (se desliza por gesto, sin
 * auto-avance). Todo decorativo: solo da realismo a la app.
 */

import { useRef, useState } from 'react';
import { Menu } from 'lucide-react';
import { CUENTA_GM } from './datosMock';
import ilustracionEnlace from '../../../assets/img/gmail/reu1.svg';
import ilustracionJuntos from '../../../assets/img/gmail/reu2.svg';
import ilustracionSegura from '../../../assets/img/gmail/reu3.svg';

interface Props {
  onAbrirDrawer: () => void;
}

const LAMINAS = [
  {
    imagen: ilustracionEnlace,
    titulo: 'Obtén un enlace para compartir',
    texto:
      'Toca Nueva reunión para generar un enlace que puedes compartir con las personas con las que quieres reunirte',
  },
  {
    imagen: ilustracionJuntos,
    titulo: 'Ver a todos juntos',
    texto: 'Para ver más participantes a la vez, ve a Ajustar vista en el menú Más opciones',
  },
  {
    imagen: ilustracionSegura,
    titulo: 'Tu reunión es segura',
    texto:
      'Ninguna persona ajena a tu organización puede unirse a una reunión a menos que haya recibido una invitación o que la haya admitido el organizador',
  },
];

/** Umbral de arrastre horizontal para pasar de lamina. */
const UMBRAL_GESTO = 40;

export function MeetGm({ onAbrirDrawer }: Props) {
  const [indice, setIndice] = useState(0);
  const inicioGesto = useRef<number | null>(null);

  const alSoltar = (x: number) => {
    if (inicioGesto.current === null) return;
    const delta = x - inicioGesto.current;
    inicioGesto.current = null;
    if (Math.abs(delta) < UMBRAL_GESTO) return;
    setIndice((actual) => Math.min(LAMINAS.length - 1, Math.max(0, actual + (delta < 0 ? 1 : -1))));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col text-[var(--color-gm-texto)]">
      <header className="flex items-center px-4 py-2">
        <button
          type="button"
          aria-label="Abrir el menú de Gmail"
          onClick={onAbrirDrawer}
          className="-ml-2 flex h-10 w-10 items-center justify-center"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-[19px]">Reunión</h1>
        <span
          aria-hidden="true"
          className={`flex h-8 w-8 items-center justify-center rounded-full ${CUENTA_GM.claseAvatar} text-sm font-medium text-white`}
        >
          {CUENTA_GM.inicial}
        </span>
      </header>

      <div aria-hidden="true" className="flex gap-3 px-4 pt-2">
        <span className="flex h-10 items-center rounded-full bg-[var(--color-gm-meet)] px-5 text-sm font-semibold text-white">
          Nueva reunión
        </span>
        <span className="flex h-10 items-center rounded-full border border-[var(--color-gm-texto-suave)]/40 px-5 text-sm font-semibold text-[var(--color-gm-meet)]">
          Unirse con un código
        </span>
      </div>

      {/* Carrusel de laminas por indice, como el de la app real */}
      <div
        className="min-h-0 flex-1 touch-pan-y overflow-hidden"
        onPointerDown={(e) => {
          inicioGesto.current = e.clientX;
        }}
        onPointerUp={(e) => alSoltar(e.clientX)}
        onPointerCancel={() => {
          inicioGesto.current = null;
        }}
      >
        <div
          className="flex h-full transition-transform duration-300 motion-reduce:transition-none"
          style={{ transform: `translateX(-${indice * 100}%)` }}
        >
          {LAMINAS.map((lamina) => (
            <div
              key={lamina.titulo}
              className="flex h-full w-full shrink-0 flex-col items-center justify-center px-8 text-center"
            >
              <img src={lamina.imagen} alt="" draggable={false} className="max-h-[55%] w-auto" />
              <h2 className="pt-4 text-[19px]">{lamina.titulo}</h2>
              <p className="pt-2 text-sm text-[var(--color-gm-texto-suave)]">{lamina.texto}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2 pb-4" role="tablist" aria-label="Láminas de Meet">
        {LAMINAS.map((lamina, i) => (
          <button
            key={lamina.titulo}
            type="button"
            role="tab"
            aria-selected={i === indice}
            aria-label={lamina.titulo}
            onClick={() => setIndice(i)}
            className={`h-2 w-2 rounded-full ${i === indice ? 'bg-[var(--color-gm-azul)]' : 'bg-[var(--color-gm-texto-suave)]/40'}`}
          />
        ))}
      </div>
    </div>
  );
}
