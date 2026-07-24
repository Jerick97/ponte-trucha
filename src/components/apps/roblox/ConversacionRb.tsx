/**
 * Hilo de chat abierto en Roblox: header con avatar y nombre, recordatorio
 * de seguridad de la plataforma (vale para amigos y desconocidos, no
 * delata la respuesta) y el loop del juego con la piel de Roblox.
 */

import { useEffect } from 'react';
import { ChevronLeft, ShieldCheck } from 'lucide-react';
import type { Escenario, Veredicto } from '../../../types/escenario';
import type { TurnoChat } from '../../../llm';
import { StatusBar } from '../../telefono/StatusBar';
import { useArrastreScroll } from '../../telefono/useArrastreScroll';
import { avatarRemitente } from './datosMock';
import { AvatarRb } from './AvatarRb';
import { BurbujaRb } from './BurbujaRb';
import { ComposerRb } from './ComposerRb';
import { TarjetaFeedbackRb } from './TarjetaFeedbackRb';

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

export function ConversacionRb(props: Props) {
  const { escenario, fase, ultimoResultado, turnos, chatCargando, chatAgotado } = props;
  const arrastre = useArrastreScroll();

  // Mantiene a la vista lo ultimo del hilo cuando llegan turnos nuevos.
  const totalTurnos = turnos.length;
  const refContenedor = arrastre.contenedor;
  useEffect(() => {
    const el = refContenedor.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [totalTurnos, fase, refContenedor]);

  return (
    <div className="flex h-full flex-col bg-[var(--color-rb-fondo)] text-[var(--color-rb-texto)]">
      <StatusBar claro />

      <header className="flex items-center gap-2 border-b border-[var(--color-rb-superficie)] px-3 py-2">
        <button type="button" aria-label="Volver a Equipo" onClick={props.onVolver}>
          <ChevronLeft className="h-6 w-6" />
        </button>
        <AvatarRb avatar={avatarRemitente(escenario.remitente.nombre)} clase="h-8 w-8" enLinea />
        <span className="truncate text-[15px] font-semibold">{escenario.remitente.nombre}</span>
      </header>

      <div
        ref={arrastre.contenedor}
        className="sin-scrollbar flex min-h-0 flex-1 touch-pan-y flex-col overflow-y-auto pb-2 pt-2"
        onPointerDown={arrastre.alPresionar}
        onPointerMove={arrastre.alMover}
        onPointerUp={arrastre.alSoltar}
        onPointerCancel={arrastre.alSoltar}
        onClickCapture={arrastre.alCapturarClick}
      >
        <p aria-hidden="true" className="pb-2 text-center text-xs text-[var(--color-rb-texto-suave)]">
          Hoy 9:41
        </p>

        <BurbujaRb
          texto={escenario.mensaje}
          senalesResaltadas={fase === 'feedback' ? escenario.senales : undefined}
        />

        {/* Recordatorio real de la plataforma: pista educativa neutral */}
        <p className="flex items-start gap-1.5 px-6 pt-2 text-center text-xs text-[var(--color-rb-texto-suave)]">
          <ShieldCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Roblox nunca te pedirá tu contraseña. No compartas datos personales en el chat.
        </p>

        {fase === 'feedback' && ultimoResultado && (
          <TarjetaFeedbackRb
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
            <BurbujaRb key={i} texto={turno.texto} propia={turno.autor === 'nino'} />
          ))}

        {fase === 'chat' && chatCargando && (
          <div className="flex px-4 py-0.5">
            <span className="rounded-2xl rounded-bl-md bg-[var(--color-rb-superficie-alta)] px-4 py-2.5">
              <span aria-label="Escribiendo" className="flex gap-1">
                <i className="h-2 w-2 rounded-full bg-[var(--color-rb-texto-suave)]" />
                <i className="h-2 w-2 rounded-full bg-[var(--color-rb-texto-suave)] opacity-70" />
                <i className="h-2 w-2 rounded-full bg-[var(--color-rb-texto-suave)] opacity-40" />
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
              className="min-h-14 rounded-2xl bg-[var(--color-rb-verde)] px-3 text-[15px] font-bold text-white shadow-lg transition active:scale-[0.98]"
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
              className="min-h-12 w-full rounded-full bg-[var(--color-rb-azul)] px-4 text-sm font-bold text-white"
            >
              Cortar la conversación
            </button>
          </div>
        )}
      </div>

      <ComposerRb
        habilitado={fase === 'chat' && !chatAgotado}
        cargando={chatCargando}
        onEnviar={props.onEnviar}
      />
    </div>
  );
}
