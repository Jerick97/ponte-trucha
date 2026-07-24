/**
 * Hilo abierto de Mensajes de iOS con un remitente desconocido: header con
 * avatar grande centrado, "Text Message · SMS" y el aviso real de spam
 * bajo el mensaje ("Si no esperabas este mensaje..."), como en las
 * referencias de estafas. Aqui vive el loop del juego.
 */

import { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Escenario, Veredicto } from '../../../types/escenario';
import type { TurnoChat } from '../../../llm';
import { StatusBar } from '../../telefono/StatusBar';
import { useArrastreScroll } from '../../telefono/useArrastreScroll';
import { AvatarSms } from './AvatarSms';
import { BurbujaSms } from './BurbujaSms';
import { ComposerSms } from './ComposerSms';
import { TarjetaFeedbackSms } from './TarjetaFeedbackSms';

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

export function ConversacionSms(props: Props) {
  const { escenario, fase, ultimoResultado, turnos, chatCargando, chatAgotado } = props;
  const arrastre = useArrastreScroll();

  // Mantiene a la vista lo ultimo del hilo cuando llegan turnos nuevos.
  const totalTurnos = turnos.length;
  const refContenedor = arrastre.contenedor;
  useEffect(() => {
    const el = refContenedor.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [totalTurnos, fase, refContenedor]);

  const indiceUltimoPropio = turnos.reduce(
    (ultimo, turno, i) => (turno.autor === 'nino' ? i : ultimo),
    -1,
  );

  return (
    <div className="flex h-full flex-col bg-[var(--color-sms-fondo)]">
      {/* Header iOS: volver a la izquierda, avatar grande centrado */}
      <div className="border-b border-[var(--color-sms-superficie)] pb-2 text-[var(--color-sms-texto)]">
        <StatusBar claro={false} />
        <div className="relative px-2">
          <button
            type="button"
            aria-label="Volver a los mensajes"
            onClick={props.onVolver}
            className="absolute left-2 top-1 flex h-10 items-center gap-1 px-1 text-[var(--color-sms-azul)]"
          >
            <ChevronLeft className="h-6 w-6" />
            <span
              aria-hidden="true"
              className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-sms-texto)] px-1.5 text-[11px] font-bold text-white"
            >
              5
            </span>
          </button>
          <div className="pt-1 text-center">
            <AvatarSms avatar={escenario.remitente.avatar} clase="mx-auto h-12 w-12" />
            <p className="mt-1 flex items-center justify-center gap-0.5 text-xs text-[var(--color-sms-texto)]">
              <span className="max-w-40 truncate">{escenario.remitente.nombre}</span>
              <ChevronRight aria-hidden="true" className="h-3 w-3 text-[var(--color-sms-texto-suave)]" />
            </p>
          </div>
        </div>
      </div>

      <div
        ref={arrastre.contenedor}
        className="sin-scrollbar flex min-h-0 flex-1 touch-pan-y flex-col overflow-y-auto pb-2 pt-2"
        onPointerDown={arrastre.alPresionar}
        onPointerMove={arrastre.alMover}
        onPointerUp={arrastre.alSoltar}
        onPointerCancel={arrastre.alSoltar}
        onClickCapture={arrastre.alCapturarClick}
      >
        <p aria-hidden="true" className="pb-2 text-center text-xs text-[var(--color-sms-texto-suave)]">
          Mensaje de texto · SMS
          <br />
          Hoy 9:41
        </p>

        <BurbujaSms
          texto={escenario.mensaje}
          senalesResaltadas={fase === 'feedback' ? escenario.senales : undefined}
        />

        {/* Aviso real de iOS para remitentes desconocidos: pista educativa */}
        <div className="px-6 pt-2 text-center text-xs text-[var(--color-sms-texto-suave)]">
          <p>Si no esperabas este mensaje de un remitente desconocido, podría ser spam.</p>
          <p aria-hidden="true" className="mt-1.5">
            <span className="rounded-full bg-[var(--color-sms-superficie)] px-3 py-1.5 font-semibold text-[var(--color-sms-azul)]">
              Reportar spam
            </span>
          </p>
        </div>

        {fase === 'feedback' && ultimoResultado && (
          <TarjetaFeedbackSms
            escenario={escenario}
            acerto={ultimoResultado.acerto}
            puntosGanados={ultimoResultado.puntosGanados}
            onChatear={props.onChatear}
            onSiguiente={props.onSiguiente}
          />
        )}

        {fase === 'chat' && turnos.length > 0 && <div className="pt-2" />}
        {fase === 'chat' &&
          turnos.map((turno, i) => (
            <BurbujaSms
              key={i}
              texto={turno.texto}
              propia={turno.autor === 'nino'}
              entregado={i === indiceUltimoPropio}
            />
          ))}

        {fase === 'chat' && chatCargando && (
          <div className="flex px-4 py-0.5">
            <span className="rounded-3xl rounded-bl-md bg-[var(--color-sms-burbuja-entrante)] px-4 py-2.5">
              <span aria-label="Escribiendo" className="flex gap-1">
                <i className="h-2 w-2 rounded-full bg-[var(--color-sms-texto-suave)]" />
                <i className="h-2 w-2 rounded-full bg-[var(--color-sms-texto-suave)] opacity-70" />
                <i className="h-2 w-2 rounded-full bg-[var(--color-sms-texto-suave)] opacity-40" />
              </span>
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
              className="min-h-14 rounded-2xl bg-[var(--color-sms-burbuja-propia)] px-3 text-[15px] font-bold text-white shadow-lg transition active:scale-[0.98]"
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
              className="min-h-12 w-full rounded-full bg-[var(--color-sms-azul)] px-4 text-sm font-bold text-white"
            >
              Cortar la conversación
            </button>
          </div>
        )}
      </div>

      <ComposerSms
        habilitado={fase === 'chat' && !chatAgotado}
        cargando={chatCargando}
        onEnviar={props.onEnviar}
      />
    </div>
  );
}
