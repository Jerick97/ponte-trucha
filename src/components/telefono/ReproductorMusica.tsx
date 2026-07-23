/**
 * Widget de musica de la pantalla de bloqueo: caratula, pista actual,
 * progreso y controles. Si no hay canciones en assets/audio, muestra
 * el estado vacio con los controles desactivados.
 */

import { useRef, useState } from 'react';
import type { Cancion } from './canciones';
import { IconoAnterior, IconoNota, IconoPausa, IconoPlay, IconoSiguiente } from './Iconos';

interface Props {
  canciones: Cancion[];
}

function formatearTiempo(segundos: number): string {
  if (!Number.isFinite(segundos)) return '0:00';
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ReproductorMusica({ canciones }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [indice, setIndice] = useState(0);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [tiempo, setTiempo] = useState(0);
  const [duracion, setDuracion] = useState(0);

  const vacio = canciones.length === 0;
  const cancion = canciones[indice] ?? null;

  function alternar() {
    const audio = audioRef.current;
    if (!audio || vacio) return;
    if (reproduciendo) {
      audio.pause();
      setReproduciendo(false);
    } else {
      void audio.play();
      setReproduciendo(true);
    }
  }

  function saltar(paso: number) {
    if (vacio) return;
    const siguiente = (indice + paso + canciones.length) % canciones.length;
    setIndice(siguiente);
    setTiempo(0);
    // El autoplay de la nueva pista solo si ya estaba sonando.
    requestAnimationFrame(() => {
      if (reproduciendo) void audioRef.current?.play();
    });
  }

  const progreso = duracion > 0 ? (tiempo / duracion) * 100 : 0;
  const claseControl =
    'flex h-11 w-11 items-center justify-center rounded-full text-xl text-[var(--color-texto)] disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-marca-500)]';

  return (
    <div className="mx-auto w-full max-w-72 rounded-3xl bg-[var(--color-notificacion-fondo)]/90 p-4 shadow-xl backdrop-blur-md">
      {cancion && (
        <audio
          ref={audioRef}
          src={cancion.src}
          onTimeUpdate={(e) => setTiempo(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuracion(e.currentTarget.duration)}
          onEnded={() => saltar(1)}
        />
      )}

      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--color-app-chat-juego)] text-2xl shadow-inner transition-transform ${
            reproduciendo ? 'scale-110' : 'scale-100'
          }`}
        >
          {cancion?.caratula ? (
            <img src={cancion.caratula} alt="" draggable={false} className="h-full w-full object-cover" />
          ) : (
            <IconoNota className="h-7 w-7 text-[var(--color-lock-texto)]" />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate font-bold text-[var(--color-texto)]">
            {cancion?.titulo ?? 'Sin musica todavia'}
          </p>
          <p className="truncate text-xs text-[var(--color-texto-suave)]">
            {vacio ? 'Agrega canciones en assets/audio' : 'Radio Trucha'}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div aria-hidden="true" className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-texto)]/15">
          <div
            className="h-full rounded-full bg-[var(--color-texto)]/70"
            style={{ width: `${progreso}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-[var(--color-texto-suave)]">
          <span>{formatearTiempo(tiempo)}</span>
          <span>{formatearTiempo(duracion)}</span>
        </div>
      </div>

      <div className="mt-1 flex items-center justify-center gap-4">
        <button type="button" aria-label="Cancion anterior" disabled={vacio} onClick={() => saltar(-1)} className={claseControl}>
          <IconoAnterior className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
          disabled={vacio}
          onClick={alternar}
          className={`${claseControl} bg-[var(--color-texto)]/10`}
        >
          {reproduciendo ? <IconoPausa className="h-5 w-5" /> : <IconoPlay className="h-5 w-5" />}
        </button>
        <button type="button" aria-label="Siguiente cancion" disabled={vacio} onClick={() => saltar(1)} className={claseControl}>
          <IconoSiguiente className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
