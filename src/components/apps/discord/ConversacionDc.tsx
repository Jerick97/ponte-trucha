/**
 * DM abierto de Discord: header con llamadas, banner de "no es tu amigo"
 * (solicitud / bloquear / denunciar, como en la referencia), separador de
 * dia y mensajes en filas. Aqui vive el loop del juego: decidir ->
 * feedback -> chatear con el estafador.
 */

import { useEffect, useRef } from 'react';
import { ArrowLeft, ChevronRight, Phone, Search, Video } from 'lucide-react';
import type { Escenario, Veredicto } from '../../../types/escenario';
import type { TurnoChat } from '../../../llm';
import { StatusBar } from '../../telefono/StatusBar';
import { HORA_SIMULADA } from '../../telefono/simulados';
import { useArrastreScroll } from '../../telefono/useArrastreScroll';
import { AvatarDc } from './AvatarDc';
import { MensajeDc } from './MensajeDc';
import { ComposerDc } from './ComposerDc';
import { TarjetaFeedbackDc } from './TarjetaFeedbackDc';
import { JUGADOR } from './datosMock';
import { reproducirSonidoDc } from './sonidosDc';

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

export function ConversacionDc(props: Props) {
  const { escenario, fase, ultimoResultado, turnos, chatCargando, chatAgotado } = props;
  const arrastre = useArrastreScroll();

  // Ping de Discord cuando el estafador responde (solo turnos nuevos: al
  // reabrir la conversacion no vuelve a sonar).
  const turnosPrevios = useRef(turnos.length);
  useEffect(() => {
    if (turnos.length > turnosPrevios.current && turnos[turnos.length - 1]?.autor === 'estafador') {
      reproducirSonidoDc('ping');
    }
    turnosPrevios.current = turnos.length;
  }, [turnos]);

  return (
    <div className="flex h-full flex-col bg-[var(--color-dc-fondo)]">
      <div className="bg-[var(--color-dc-fondo)] pb-1 text-[var(--color-dc-texto)]">
        <StatusBar claro />
        <div className="flex items-center gap-1 px-1.5">
          <button
            type="button"
            aria-label="Volver a los mensajes"
            onClick={props.onVolver}
            className="relative flex h-11 w-11 items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5" />
            <span
              aria-hidden="true"
              className="absolute right-0 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-dc-rojo)] px-1 text-[9px] font-bold text-white"
            >
              9+
            </span>
          </button>
          <AvatarDc avatar={escenario.remitente.avatar} clase="h-8 w-8" claseEmoji="text-base" />
          <div className="ml-1.5 flex min-w-0 flex-1 items-center gap-0.5">
            <p className="truncate text-[16px] font-bold leading-tight">{escenario.remitente.nombre}</p>
            <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--color-dc-texto-suave)]" />
          </div>
          <span aria-hidden="true" className="flex items-center">
            <span className="flex h-10 w-10 items-center justify-center">
              <Phone className="h-5 w-5" />
            </span>
            <span className="flex h-10 w-10 items-center justify-center">
              <Video className="h-5 w-5" />
            </span>
            <span className="flex h-10 w-9 items-center justify-center">
              <Search className="h-5 w-5" />
            </span>
          </span>
        </div>
      </div>

      <div
        ref={arrastre.contenedor}
        className="sin-scrollbar flex min-h-0 flex-1 touch-pan-y flex-col overflow-y-auto pb-2"
        onPointerDown={arrastre.alPresionar}
        onPointerMove={arrastre.alMover}
        onPointerUp={arrastre.alSoltar}
        onPointerCancel={arrastre.alSoltar}
        onClickCapture={arrastre.alCapturarClick}
      >
        {/* Discord avisa cuando quien te escribe no es tu amigo: pista real */}
        <div aria-hidden="true" className="flex flex-wrap gap-2 px-4 pb-1 pt-2">
          <span className="rounded-full bg-[var(--color-dc-verde)] px-4 py-2 text-sm font-semibold text-white">
            Enviar solicitud de amistad
          </span>
          <span className="rounded-full bg-[var(--color-dc-superficie-alta)] px-4 py-2 text-sm font-semibold text-[var(--color-dc-texto)]">
            Bloquear
          </span>
          <span className="rounded-full bg-[var(--color-dc-rojo)] px-4 py-2 text-sm font-semibold text-white">
            Denunciar spam
          </span>
        </div>

        <div aria-hidden="true" className="flex items-center gap-3 px-4 py-2">
          <span className="h-px flex-1 bg-[var(--color-dc-superficie-alta)]" />
          <span className="text-xs font-semibold text-[var(--color-dc-texto-suave)]">Hoy</span>
          <span className="h-px flex-1 bg-[var(--color-dc-superficie-alta)]" />
        </div>

        <MensajeDc
          nombre={escenario.remitente.nombre}
          avatar={escenario.remitente.avatar}
          hora={`hoy a las ${HORA_SIMULADA}`}
          texto={escenario.mensaje}
          senalesResaltadas={fase === 'feedback' ? escenario.senales : undefined}
        />

        {fase === 'feedback' && ultimoResultado && (
          <TarjetaFeedbackDc
            escenario={escenario}
            acerto={ultimoResultado.acerto}
            puntosGanados={ultimoResultado.puntosGanados}
            onChatear={props.onChatear}
            onSiguiente={props.onSiguiente}
          />
        )}

        {fase === 'chat' &&
          turnos.map((turno, i) => (
            <MensajeDc
              key={i}
              nombre={turno.autor === 'nino' ? JUGADOR.nombre : escenario.remitente.nombre}
              avatar={turno.autor === 'nino' ? JUGADOR.avatar : escenario.remitente.avatar}
              hora={`hoy a las ${HORA_SIMULADA}`}
              texto={turno.texto}
              propio={turno.autor === 'nino'}
            />
          ))}

        {fase === 'chat' && chatCargando && (
          <p className="px-4 py-1 text-sm italic text-[var(--color-dc-texto-suave)]">
            {escenario.remitente.nombre} está escribiendo…
          </p>
        )}

        {fase === 'mensaje' && (
          <div className="mt-auto grid grid-cols-2 gap-2 px-3 pt-3">
            <button
              type="button"
              onClick={() => props.onResponder('trampa')}
              className="min-h-14 rounded-2xl bg-[var(--color-dc-rojo)] px-3 text-[15px] font-bold text-white shadow-lg transition active:scale-[0.98]"
            >
              Es trampa
            </button>
            <button
              type="button"
              onClick={() => props.onResponder('confianza')}
              className="min-h-14 rounded-2xl bg-[var(--color-dc-verde)] px-3 text-[15px] font-bold text-white shadow-lg transition active:scale-[0.98]"
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
              className="min-h-12 w-full rounded-full bg-[var(--color-dc-blurple)] px-4 text-sm font-bold text-white"
            >
              Cortar la conversación
            </button>
          </div>
        )}
      </div>

      <ComposerDc
        destinatario={escenario.remitente.nombre}
        habilitado={fase === 'chat' && !chatAgotado}
        cargando={chatCargando}
        onEnviar={props.onEnviar}
      />
    </div>
  );
}
