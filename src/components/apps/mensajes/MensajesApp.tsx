/**
 * App de Mensajes de iOS del simulador: lista de hilos <-> conversacion
 * del escenario. La lista se abre primero (el nino encuentra el hilo con
 * su punto azul de no leido); la home bar cierra la app.
 */

import { useState } from 'react';
import type { Escenario, Veredicto } from '../../../types/escenario';
import type { TurnoChat } from '../../../llm';
import { ListaSms } from './ListaSms';
import { ConversacionSms } from './ConversacionSms';

interface Props {
  escenario: Escenario | null;
  fase: 'mensaje' | 'feedback' | 'chat' | 'inicio' | 'resultado';
  ultimoResultado: { acerto: boolean; puntosGanados: number } | null;
  turnos: readonly TurnoChat[];
  chatCargando: boolean;
  chatAgotado: boolean;
  onResponder: (respuesta: Veredicto) => void;
  onChatear: () => void;
  onSiguiente: () => void;
  onEnviar: (texto: string) => void;
  /** Cierra la app y vuelve al home del telefono. */
  onCerrar: () => void;
}

export function MensajesApp(props: Props) {
  const [conversacionAbierta, setConversacionAbierta] = useState(false);
  const { escenario, fase } = props;
  const enJuego = fase === 'mensaje' || fase === 'feedback' || fase === 'chat';

  const pantalla =
    conversacionAbierta && escenario && enJuego ? (
      <ConversacionSms
        escenario={escenario}
        fase={fase}
        ultimoResultado={props.ultimoResultado}
        turnos={props.turnos}
        chatCargando={props.chatCargando}
        chatAgotado={props.chatAgotado}
        onResponder={props.onResponder}
        onChatear={props.onChatear}
        onSiguiente={props.onSiguiente}
        onEnviar={props.onEnviar}
        onVolver={() => setConversacionAbierta(false)}
      />
    ) : (
      <ListaSms
        escenario={enJuego ? escenario : null}
        sinLeer={fase === 'mensaje' && !conversacionAbierta}
        onAbrirEscenario={() => setConversacionAbierta(true)}
      />
    );

  return (
    <div className="relative h-full">
      {pantalla}
      {/* Home bar de iOS (oscura sobre app clara): vuelve al inicio */}
      <button
        type="button"
        aria-label="Ir a la pantalla de inicio"
        onClick={props.onCerrar}
        className="absolute bottom-0 left-1/2 z-10 flex h-6 w-44 -translate-x-1/2 items-end justify-center pb-1.5"
      >
        <span className="h-1 w-32 rounded-full bg-[var(--color-sms-texto)]/70" />
      </button>
    </div>
  );
}
