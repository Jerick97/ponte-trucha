/**
 * Conversacion abierta de WhatsApp sobre el wallpaper de garabatos:
 * header con llamadas, separador de dia, burbujas y composer. Aqui vive
 * el loop del juego: decidir -> feedback -> chatear con el estafador.
 */

import { ArrowLeft, EllipsisVertical, Phone, Video } from 'lucide-react';
import type { Escenario, Veredicto } from '../../../types/escenario';
import type { TurnoChat } from '../../../llm';
import { StatusBar } from '../../telefono/StatusBar';
import { HORA_SIMULADA } from '../../telefono/simulados';
import { useArrastreScroll } from '../../telefono/useArrastreScroll';
import { AvatarWa } from './AvatarWa';
import { BurbujaWa } from './BurbujaWa';
import { ComposerWa } from './ComposerWa';
import { TarjetaFeedbackWa } from './TarjetaFeedbackWa';
import wallpaperWa from '../../../assets/img/wallpaper/whatsapp wallpaper.jpg';

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

export function ConversacionWa(props: Props) {
  const { escenario, fase, ultimoResultado, turnos, chatCargando, chatAgotado } = props;
  const subtitulo = fase === 'chat' ? (chatCargando ? 'escribiendo…' : 'en línea') : 'desconocido';
  const arrastre = useArrastreScroll();

  return (
    <div className="flex h-full flex-col bg-[var(--color-wa-fondo)]">
      <div className="bg-[var(--color-wa-superficie)] pb-1 text-[var(--color-wa-texto)]">
        <StatusBar claro />
        <div className="flex items-center gap-1 px-1.5">
          <button
            type="button"
            aria-label="Volver a los chats"
            onClick={props.onVolver}
            className="flex h-11 w-10 items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <AvatarWa avatar={escenario.remitente.avatar} clase="h-9 w-9" />
          <div className="ml-1 min-w-0 flex-1">
            <p className="truncate text-[16px] font-semibold leading-tight">
              {escenario.remitente.nombre}
            </p>
            <p className="truncate text-xs text-[var(--color-wa-texto-suave)]">{subtitulo}</p>
          </div>
          <span aria-hidden="true" className="flex items-center">
            <span className="flex h-10 w-10 items-center justify-center">
              <Video className="h-5 w-5" />
            </span>
            <span className="flex h-10 w-10 items-center justify-center">
              <Phone className="h-5 w-5" />
            </span>
            <span className="flex h-10 w-8 items-center justify-center">
              <EllipsisVertical className="h-5 w-5" />
            </span>
          </span>
        </div>
      </div>

      <div
        ref={arrastre.contenedor}
        className="sin-scrollbar flex min-h-0 flex-1 touch-pan-y flex-col overflow-y-auto bg-cover bg-center pb-2"
        style={{ backgroundImage: `url(${wallpaperWa})` }}
        onPointerDown={arrastre.alPresionar}
        onPointerMove={arrastre.alMover}
        onPointerUp={arrastre.alSoltar}
        onPointerCancel={arrastre.alSoltar}
        onClickCapture={arrastre.alCapturarClick}
      >
        <div className="flex justify-center py-2">
          <span className="rounded-lg bg-[var(--color-wa-superficie)] px-3 py-1 text-xs text-[var(--color-wa-texto-suave)] shadow">
            Hoy
          </span>
        </div>

        <BurbujaWa
          texto={escenario.mensaje}
          hora={HORA_SIMULADA}
          senalesResaltadas={fase === 'feedback' ? escenario.senales : undefined}
        />

        {fase === 'feedback' && ultimoResultado && (
          <TarjetaFeedbackWa
            escenario={escenario}
            acerto={ultimoResultado.acerto}
            puntosGanados={ultimoResultado.puntosGanados}
            onChatear={props.onChatear}
            onSiguiente={props.onSiguiente}
          />
        )}

        {fase === 'chat' &&
          turnos.map((turno, i) => (
            <BurbujaWa key={i} texto={turno.texto} propia={turno.autor === 'nino'} hora={HORA_SIMULADA} />
          ))}

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
              className="min-h-14 rounded-2xl bg-[var(--color-wa-verde)] px-3 text-[15px] font-bold text-[var(--color-wa-fondo)] shadow-lg transition active:scale-[0.98]"
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
              className="min-h-12 w-full rounded-full bg-[var(--color-wa-verde)] px-4 text-sm font-bold text-[var(--color-wa-fondo)]"
            >
              Cortar la conversación
            </button>
          </div>
        )}
      </div>

      <ComposerWa
        habilitado={fase === 'chat' && !chatAgotado}
        cargando={chatCargando}
        onEnviar={props.onEnviar}
      />
    </div>
  );
}
