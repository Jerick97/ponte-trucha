/**
 * Fila de widgets de la pantalla de bloqueo: clima simulado, campana de
 * modo silencio (con aviso en la isla dinamica) y acceso a la musica.
 * Todo es cosmetico salvo el toggle de musica, que controla el reproductor.
 */

import { useEffect, useState } from 'react';
import { IconoCampana, IconoCampanaTachada, IconoClima } from './Iconos';
import iconoSpotify from '../../assets/img/icono_spotify.svg';

/** Clima simulado del dia (mockup, como la hora). */
const CLIMA_SIMULADO = '21°';
/** Cuanto dura visible el aviso de la isla dinamica. */
const DURACION_AVISO_MS = 2600;

interface Props {
  conMusica: boolean;
  onAlternarMusica: () => void;
}

export function WidgetsBloqueo({ conMusica, onAlternarMusica }: Props) {
  const [silencio, setSilencio] = useState(false);
  const [avisoVisible, setAvisoVisible] = useState(false);

  useEffect(() => {
    if (!avisoVisible) return;
    const temporizador = setTimeout(() => setAvisoVisible(false), DURACION_AVISO_MS);
    return () => clearTimeout(temporizador);
  }, [avisoVisible]);

  const claseWidget =
    'flex h-11 min-w-11 items-center justify-center gap-1 rounded-full bg-[var(--color-lock-texto)]/15 px-3 text-sm text-[var(--color-lock-texto)] backdrop-blur';
  const claseBoton = `${claseWidget} focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-marca-500)]`;

  return (
    <>
      {/* Aviso de la isla dinamica */}
      {avisoVisible && (
        <div
          className="isla-aviso absolute left-1/2 top-1.5 z-40 flex h-7 w-56 -translate-x-1/2 items-center justify-center gap-2 rounded-full bg-[var(--color-pantalla-apagada)] text-xs text-[var(--color-lock-texto)]"
          role="status"
        >
          {silencio ? (
            <IconoCampanaTachada className="h-4 w-4 text-[var(--color-trampa)]" />
          ) : (
            <IconoCampana className="h-4 w-4" />
          )}
          {silencio ? 'Modo silencio activado' : 'Modo silencio desactivado'}
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-3">
        <span className={claseWidget}>
          <IconoClima className="h-5 w-5" /> {CLIMA_SIMULADO}
        </span>
        <button
          type="button"
          aria-label={silencio ? 'Desactivar modo silencio' : 'Activar modo silencio'}
          aria-pressed={silencio}
          onClick={() => {
            setSilencio(!silencio);
            setAvisoVisible(true);
          }}
          className={`${claseBoton} ${silencio ? 'opacity-60' : ''}`}
        >
          {silencio ? (
            <IconoCampanaTachada className="h-5 w-5" />
          ) : (
            <IconoCampana className="h-5 w-5" />
          )}
        </button>
        <button
          type="button"
          aria-label={conMusica ? 'Ocultar musica' : 'Mostrar musica'}
          aria-pressed={conMusica}
          onClick={onAlternarMusica}
          className={claseBoton}
        >
          <img
            src={iconoSpotify}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`h-6 w-6 rounded-full transition ${conMusica ? '' : 'opacity-70 grayscale'}`}
          />
        </button>
      </div>
    </>
  );
}
