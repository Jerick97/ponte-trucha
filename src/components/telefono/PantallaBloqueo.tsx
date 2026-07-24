/**
 * Pantalla de bloqueo estilo iOS: fecha, hora grande, widgets de un
 * vistazo (clima, avisos, musica) y reproductor. Desbloqueo por gesto
 * (arrastre hacia arriba) y por boton accesible.
 */

import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { StatusBar } from './StatusBar';
import { FECHA_SIMULADA, HORA_SIMULADA } from './simulados';
import { ReproductorMusica } from './ReproductorMusica';
import { WidgetsBloqueo } from './WidgetsBloqueo';
import { NotificacionBloqueo, type DatosNotificacionBloqueo } from './NotificacionBloqueo';
import { IconoCamaraLock, IconoCandado, IconoLinterna } from './Iconos';
import { CANCIONES } from './canciones';

/** Cuantos px hacia arriba cuenta como gesto de desbloqueo. */
const UMBRAL_GESTO = 60;
/** Px de arrastre vertical para reconocer el gesto (no roba clicks). */
const UMBRAL_INICIO = 15;

interface Props {
  onDesbloquear: () => void;
  /** Notificacion visible en el bloqueo; tocarla desbloquea y abre. */
  notificacion?: DatosNotificacionBloqueo | null;
  onAbrirNotificacion?: () => void;
  /** La linterna enciende el flash de la parte trasera. */
  linterna: boolean;
  onAlternarLinterna: () => void;
  /** Abre la camara sin desbloquear, como en iOS. */
  onAbrirCamara: () => void;
}

export function PantallaBloqueo({
  onDesbloquear,
  notificacion,
  onAbrirNotificacion,
  linterna,
  onAlternarLinterna,
  onAbrirCamara,
}: Props) {
  const inicio = useRef<{ x: number; y: number } | null>(null);
  const deslizando = useRef(false);
  const [desplazamiento, setDesplazamiento] = useState(0);
  const [conMusica, setConMusica] = useState(false);

  function alPresionar(evento: PointerEvent<HTMLDivElement>) {
    inicio.current = { x: evento.clientX, y: evento.clientY };
  }

  function alMover(evento: PointerEvent<HTMLDivElement>) {
    if (!inicio.current) return;
    const dx = evento.clientX - inicio.current.x;
    const dy = evento.clientY - inicio.current.y;

    if (!deslizando.current) {
      // Solo se vuelve gesto si el arrastre es claramente hacia arriba.
      if (dy > -UMBRAL_INICIO || Math.abs(dy) < Math.abs(dx) * 1.2) return;
      deslizando.current = true;
      // La captura garantiza recibir el pointerup aunque se suelte fuera.
      evento.currentTarget.setPointerCapture(evento.pointerId);
    }
    setDesplazamiento(Math.min(0, dy));
  }

  function alSoltar(evento: PointerEvent<HTMLDivElement>) {
    if (
      deslizando.current &&
      inicio.current !== null &&
      inicio.current.y - evento.clientY > UMBRAL_GESTO
    ) {
      onDesbloquear();
    }
    if (deslizando.current) {
      evento.currentTarget.releasePointerCapture?.(evento.pointerId);
    }
    deslizando.current = false;
    inicio.current = null;
    setDesplazamiento(0);
  }

  // El transform solo se aplica durante el gesto: si estuviera siempre,
  // crearia un contexto de apilamiento que dejaria el aviso de la isla
  // (z-40) por debajo de la isla fisica (z-30) de la carcasa.
  return (
    <div
      className={`wallpaper relative flex h-full touch-none select-none flex-col overflow-y-auto ${
        deslizando.current ? '' : 'transition-transform duration-300'
      }`}
      style={desplazamiento === 0 ? undefined : { transform: `translateY(${desplazamiento}px)` }}
      onPointerDown={alPresionar}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onPointerCancel={alSoltar}
    >
      <StatusBar claro />

      <div className="mt-8 flex flex-col items-center gap-1 text-[var(--color-lock-texto)]">
        <IconoCandado className="h-5 w-5 opacity-90" />
        <span className="text-sm font-semibold capitalize opacity-85">{FECHA_SIMULADA}</span>
        <span className="bg-gradient-to-b from-[var(--color-lock-texto)] to-[var(--color-lock-texto)]/60 bg-clip-text font-[family-name:var(--font-display)] text-7xl font-bold text-transparent">
          {HORA_SIMULADA}
        </span>
      </div>

      <WidgetsBloqueo conMusica={conMusica} onAlternarMusica={() => setConMusica(!conMusica)} />

      {conMusica && (
        <div className="mt-5 px-6">
          <ReproductorMusica canciones={CANCIONES} />
        </div>
      )}

      <div className="mt-auto flex flex-col gap-4 pb-6 pt-4">
        {!conMusica && notificacion && onAbrirNotificacion && (
          <div aria-live="polite">
            <NotificacionBloqueo datos={notificacion} onAbrir={onAbrirNotificacion} />
          </div>
        )}

        {/* Linterna (enciende el flash trasero) y camara (abre la app) */}
        <div className="flex items-center justify-between px-8">
          <button
            type="button"
            aria-label={linterna ? 'Apagar linterna' : 'Encender linterna'}
            aria-pressed={linterna}
            onClick={onAlternarLinterna}
            className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-marca-500)] ${
              linterna
                ? 'bg-[var(--color-lock-texto)] text-[var(--color-marca-500)]'
                : 'bg-[var(--color-lock-texto)]/15 text-[var(--color-lock-texto)]'
            }`}
          >
            <IconoLinterna className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label="Abrir la cámara"
            onClick={onAbrirCamara}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-lock-texto)]/15 text-[var(--color-lock-texto)] backdrop-blur focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-marca-500)]"
          >
            <IconoCamaraLock className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onDesbloquear}
          className="min-h-12 rounded-full bg-[var(--color-lock-texto)]/15 px-7 text-sm font-semibold text-[var(--color-lock-texto)] backdrop-blur focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-marca-500)]"
        >
          Desliza hacia arriba para desbloquear
        </button>
        <span aria-hidden="true" className="h-1 w-32 rounded-full bg-[var(--color-lock-texto)]/60" />
        </div>
      </div>
    </div>
  );
}
