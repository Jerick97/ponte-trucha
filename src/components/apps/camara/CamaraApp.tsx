/**
 * App de Camara del simulador: replica la UI de la camara de iOS y
 * enciende la webcam real del dispositivo SOLO para el visor, con el led
 * verde junto a la isla avisando que esta en uso, como en iOS.
 *
 * Privacidad (producto para menores): el stream nunca sale del navegador.
 * El obturador captura la foto SOLO en memoria (estado de React): no se
 * guarda en disco, no se sube a ninguna parte y se pierde al cerrar la
 * app. Las pistas de la webcam se detienen al salir.
 */

import { useEffect, useRef, useState } from 'react';
import { Blend, ChevronUp, RefreshCw, Zap } from 'lucide-react';
import { reproducirSonido } from '../../telefono/sonidos';
import fotoPerrito from '../../../assets/img/camera/perrito.jpg';
import fotoPerrito2 from '../../../assets/img/camera/perrito2.jpg';

interface Props {
  /** Cierra la app y vuelve al home del telefono (apaga la webcam). */
  onCerrar: () => void;
}

const MODOS = ['Cámara lenta', 'Video', 'Foto', 'Retrato', 'Panorámica'] as const;
const FOTOS_DEMO = [fotoPerrito, fotoPerrito2];
/** Duracion del parpadeo negro del obturador. */
const PARPADEO_MS = 150;

type EstadoCamara = 'cargando' | 'activa' | 'denegada';

export function CamaraApp({ onCerrar }: Props) {
  const refVideo = useRef<HTMLVideoElement>(null);
  const [estado, setEstado] = useState<EstadoCamara>('cargando');
  const [indiceFoto, setIndiceFoto] = useState(0);
  /** Foto capturada en memoria; muere con el componente al cerrar la app. */
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  const [parpadeo, setParpadeo] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelado = false;

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((nuevoStream) => {
        // Si el nino cerro la app antes del permiso, se apaga de inmediato.
        if (cancelado) {
          nuevoStream.getTracks().forEach((pista) => pista.stop());
          return;
        }
        stream = nuevoStream;
        if (refVideo.current) refVideo.current.srcObject = nuevoStream;
        setEstado('activa');
      })
      .catch(() => setEstado('denegada'));

    return () => {
      cancelado = true;
      stream?.getTracks().forEach((pista) => pista.stop());
    };
  }, []);

  const disparar = () => {
    reproducirSonido('obturador');
    const video = refVideo.current;
    if (estado === 'activa' && video && video.videoWidth > 0) {
      // Captura espejada, igual que el visor. Solo queda en memoria.
      const lienzo = document.createElement('canvas');
      lienzo.width = video.videoWidth;
      lienzo.height = video.videoHeight;
      const contexto = lienzo.getContext('2d');
      if (contexto) {
        contexto.translate(lienzo.width, 0);
        contexto.scale(-1, 1);
        contexto.drawImage(video, 0, 0);
        setFotoCapturada(lienzo.toDataURL('image/jpeg', 0.85));
      }
    } else {
      // Sin webcam: la miniatura alterna las fotos de demo.
      setIndiceFoto((indice) => (indice + 1) % FOTOS_DEMO.length);
    }
    setParpadeo(true);
    setTimeout(() => setParpadeo(false), PARPADEO_MS);
  };

  return (
    <div className="relative flex h-full flex-col bg-[var(--color-pantalla-apagada)] pt-9 text-[var(--color-lock-texto)]">
      {/* Led verde de camara en uso, a la derecha de la isla */}
      <span
        aria-hidden="true"
        className="absolute left-[calc(50%+3.4rem)] top-3.5 z-40 h-1.5 w-1.5 rounded-full bg-[var(--color-led-camara)]"
      />
      <span className="sr-only" role="status">
        {estado === 'activa' ? 'Cámara encendida' : ''}
      </span>

      {/* Barra superior de la camara de iOS */}
      <div aria-hidden="true" className="flex items-center justify-between px-5 pb-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full">
          <Zap className="h-4 w-4" />
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-lock-texto)]/10">
          <ChevronUp className="h-4 w-4" />
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full">
          <Blend className="h-4 w-4" />
        </span>
      </div>

      {/* Visor: webcam real con cuadricula de tercios encima */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <video
          ref={refVideo}
          autoPlay
          playsInline
          muted
          className={`h-full w-full -scale-x-100 object-cover ${estado === 'activa' ? '' : 'hidden'}`}
        />
        {estado !== 'activa' && (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-8 text-center">
            <p className="text-sm text-[var(--color-lock-texto)]/80">
              {estado === 'cargando' ? 'Encendiendo la cámara…' : 'Sin acceso a la cámara'}
            </p>
            {estado === 'denegada' && (
              <p className="text-xs text-[var(--color-lock-texto)]/50">
                El navegador no dio permiso. El resto del teléfono sigue funcionando.
              </p>
            )}
          </div>
        )}
        {/* Cuadricula de tercios */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-y-0 left-1/3 w-px bg-[var(--color-lock-texto)]/25" />
          <div className="absolute inset-y-0 right-1/3 w-px bg-[var(--color-lock-texto)]/25" />
          <div className="absolute inset-x-0 top-1/3 h-px bg-[var(--color-lock-texto)]/25" />
          <div className="absolute inset-x-0 bottom-1/3 h-px bg-[var(--color-lock-texto)]/25" />
        </div>
        {/* Parpadeo del obturador */}
        {parpadeo && <div aria-hidden="true" className="absolute inset-0 bg-[var(--color-pantalla-apagada)]" />}
      </div>

      {/* Modos de captura */}
      <div aria-hidden="true" className="flex items-center justify-center gap-4 overflow-hidden py-2.5 text-[10px] uppercase tracking-wide">
        {MODOS.map((modo) => (
          <span
            key={modo}
            className={`whitespace-nowrap ${
              modo === 'Foto' ? 'font-semibold text-[var(--color-camara-acento)]' : 'text-[var(--color-lock-texto)]/85'
            }`}
          >
            {modo}
          </span>
        ))}
      </div>

      {/* Obturador: miniatura de demo, disparador y voltear (decorativo) */}
      <div className="flex items-center justify-between px-7 pb-10 pt-1">
        <img
          src={fotoCapturada ?? FOTOS_DEMO[indiceFoto]}
          alt="Última foto"
          draggable={false}
          className="h-10 w-10 rounded-md object-cover"
        />
        <button
          type="button"
          aria-label="Tomar foto"
          onClick={disparar}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-lock-texto)] transition active:scale-95"
        >
          <span className="h-12 w-12 rounded-full border border-[var(--color-pantalla-apagada)]" />
        </button>
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-lock-texto)]/10"
        >
          <RefreshCw className="h-4 w-4" />
        </span>
      </div>

      {/* Home bar de iOS (clara sobre app negra): vuelve al inicio */}
      <button
        type="button"
        aria-label="Ir a la pantalla de inicio"
        onClick={onCerrar}
        className="absolute bottom-0 left-1/2 z-10 flex h-6 w-44 -translate-x-1/2 items-end justify-center pb-1.5"
      >
        <span className="h-1 w-32 rounded-full bg-[var(--color-lock-texto)]/70" />
      </button>
    </div>
  );
}
