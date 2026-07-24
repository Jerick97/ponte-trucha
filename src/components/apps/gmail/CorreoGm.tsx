/**
 * Correo del escenario abierto: barra de acciones, asunto con su chip
 * "Recibidos", fila del remitente con "para mí" y el cuerpo del mensaje.
 * Aqui vive el loop del juego; la conversacion con el estafador se
 * renderiza como respuestas del hilo, al estilo Gmail.
 */

import { useEffect, type ReactNode } from 'react';
import {
  Archive,
  ArrowLeft,
  ChevronDown,
  EllipsisVertical,
  Mail,
  Reply,
  Smile,
  Star,
  Trash2,
} from 'lucide-react';
import type { Escenario, Veredicto } from '../../../types/escenario';
import type { TurnoChat } from '../../../llm';
import { StatusBar } from '../../telefono/StatusBar';
import { useArrastreScroll } from '../../telefono/useArrastreScroll';
import { AvatarGm } from './AvatarGm';
import { ComposerGm } from './ComposerGm';
import { TarjetaFeedbackGm } from './TarjetaFeedbackGm';
import { asuntoDe, claseAvatarRemitente, CUENTA_GM } from './datosMock';

interface Props {
  escenario: Escenario;
  fase: 'mensaje' | 'feedback' | 'chat';
  ultimoResultado: { acerto: boolean; puntosGanados: number } | null;
  turnos: readonly TurnoChat[];
  chatCargando: boolean;
  chatAgotado: boolean;
  onResponder: (respuesta: Veredicto) => void;
  onChatear: () => void;
  onSiguiente: () => void;
  onEnviar: (texto: string) => void;
  onVolver: () => void;
}

/** Cabecera de una respuesta del hilo (avatar + autor + "ahora"). */
function CabeceraRespuesta({ avatar, nombre }: { avatar: ReactNode; nombre: string }) {
  return (
    <div className="flex items-center gap-3">
      {avatar}
      <p className="min-w-0 flex-1">
        <span className="mr-2 text-[15px] font-semibold">{nombre}</span>
        <span className="text-xs text-[var(--color-gm-texto-suave)]">ahora</span>
      </p>
    </div>
  );
}

export function CorreoGm(props: Props) {
  const { escenario, fase, ultimoResultado, turnos, chatCargando, chatAgotado } = props;
  const arrastre = useArrastreScroll();
  const remitente = escenario.remitente;

  // Mantiene a la vista lo ultimo del hilo cuando llegan turnos nuevos.
  const totalTurnos = turnos.length;
  const refContenedor = arrastre.contenedor;
  useEffect(() => {
    const el = refContenedor.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [totalTurnos, fase, refContenedor]);

  const avatarRemitente = (clase: string) => (
    <AvatarGm
      avatar={remitente.avatar}
      nombre={remitente.nombre}
      claseColor={claseAvatarRemitente(remitente.nombre)}
      clase={clase}
    />
  );

  return (
    <div className="flex h-full flex-col bg-[var(--color-gm-fondo)] text-[var(--color-gm-texto)]">
      <StatusBar claro={false} />

      {/* Barra de acciones del correo */}
      <div className="flex items-center px-4 py-2">
        <button
          type="button"
          aria-label="Volver a la bandeja"
          onClick={props.onVolver}
          className="-ml-2 flex h-10 w-10 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span aria-hidden="true" className="ml-auto flex items-center gap-5 text-[var(--color-gm-texto)]">
          <Archive className="h-5 w-5" />
          <Trash2 className="h-5 w-5" />
          <Mail className="h-5 w-5" />
          <EllipsisVertical className="h-5 w-5" />
        </span>
      </div>

      <div
        ref={arrastre.contenedor}
        className="sin-scrollbar min-h-0 flex-1 touch-pan-y overflow-y-auto pb-3"
        onPointerDown={arrastre.alPresionar}
        onPointerMove={arrastre.alMover}
        onPointerUp={arrastre.alSoltar}
        onPointerCancel={arrastre.alSoltar}
        onClickCapture={arrastre.alCapturarClick}
      >
        {/* Asunto + chip Recibidos */}
        <div className="flex items-start gap-3 px-4 pb-3 pt-2">
          <h1 className="min-w-0 flex-1 text-[21px] leading-snug">
            {asuntoDe(escenario.mensaje)}{' '}
            <span className="inline-block translate-y-[-2px] rounded bg-[var(--color-gm-superficie)] px-1.5 py-0.5 text-[11px] text-[var(--color-gm-texto-suave)]">
              Recibidos
            </span>
          </h1>
          <Star aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-[var(--color-gm-texto-suave)]" />
        </div>

        {/* Fila del remitente */}
        <div className="flex items-center gap-3 px-4 pb-4">
          {avatarRemitente('h-10 w-10')}
          <div className="min-w-0 flex-1">
            <p className="flex items-baseline gap-2">
              <span className="max-w-36 truncate text-[15px] font-semibold">{remitente.nombre}</span>
              <span className="text-xs text-[var(--color-gm-texto-suave)]">9:41</span>
            </p>
            <p className="flex items-center gap-0.5 text-xs text-[var(--color-gm-texto-suave)]">
              para mí
              <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
            </p>
          </div>
          <span aria-hidden="true" className="flex items-center gap-4 text-[var(--color-gm-texto-suave)]">
            <Smile className="h-5 w-5" />
            <Reply className="h-5 w-5 text-[var(--color-gm-texto)]" />
            <EllipsisVertical className="h-5 w-5 text-[var(--color-gm-texto)]" />
          </span>
        </div>

        {/* Cuerpo del correo */}
        <p className="whitespace-pre-line px-4 pb-4 text-[15px] leading-relaxed">{escenario.mensaje}</p>

        {fase === 'feedback' && ultimoResultado && (
          <TarjetaFeedbackGm
            escenario={escenario}
            acerto={ultimoResultado.acerto}
            puntosGanados={ultimoResultado.puntosGanados}
            onChatear={props.onChatear}
            onSiguiente={props.onSiguiente}
          />
        )}

        {/* Respuestas del hilo: la conversacion con el estafador */}
        {fase === 'chat' &&
          turnos.map((turno, i) => (
            <div key={i} className="border-t border-[var(--color-gm-superficie)] px-4 py-3">
              {turno.autor === 'nino' ? (
                <CabeceraRespuesta
                  avatar={
                    <span
                      aria-hidden="true"
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${CUENTA_GM.claseAvatar} text-sm font-medium text-white`}
                    >
                      {CUENTA_GM.inicial}
                    </span>
                  }
                  nombre="Tú"
                />
              ) : (
                <CabeceraRespuesta avatar={avatarRemitente('h-8 w-8')} nombre={remitente.nombre} />
              )}
              <p className="whitespace-pre-line pl-11 pt-1 text-[15px] leading-relaxed">{turno.texto}</p>
            </div>
          ))}

        {fase === 'chat' && chatCargando && (
          <div className="border-t border-[var(--color-gm-superficie)] px-4 py-3">
            <CabeceraRespuesta avatar={avatarRemitente('h-8 w-8')} nombre={remitente.nombre} />
            <span aria-label="Escribiendo" className="flex gap-1 pl-11 pt-2">
              <i className="h-2 w-2 rounded-full bg-[var(--color-gm-texto-suave)]" />
              <i className="h-2 w-2 rounded-full bg-[var(--color-gm-texto-suave)] opacity-70" />
              <i className="h-2 w-2 rounded-full bg-[var(--color-gm-texto-suave)] opacity-40" />
            </span>
          </div>
        )}

        {fase === 'mensaje' && (
          <div className="mt-auto grid grid-cols-2 gap-2 px-3 pt-3">
            <button
              type="button"
              onClick={() => props.onResponder('trampa')}
              className="min-h-14 rounded-2xl bg-[var(--color-trampa)] px-3 text-[15px] font-bold text-white shadow-lg transition active:scale-[0.98]"
            >
              Es trampa
            </button>
            <button
              type="button"
              onClick={() => props.onResponder('confianza')}
              className="min-h-14 rounded-2xl bg-[var(--color-gm-azul)] px-3 text-[15px] font-bold text-white shadow-lg transition active:scale-[0.98]"
            >
              De confianza
            </button>
          </div>
        )}

        {fase === 'chat' && chatAgotado && (
          <div className="px-3 pt-2">
            <button
              type="button"
              onClick={props.onSiguiente}
              className="min-h-12 w-full rounded-full bg-[var(--color-gm-azul)] px-4 text-sm font-bold text-white"
            >
              Cortar la conversación
            </button>
          </div>
        )}
      </div>

      <ComposerGm habilitado={fase === 'chat' && !chatAgotado} cargando={chatCargando} onEnviar={props.onEnviar} />
    </div>
  );
}
