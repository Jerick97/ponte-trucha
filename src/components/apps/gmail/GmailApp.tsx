/**
 * App de Gmail del simulador: bandeja <-> correo del escenario, con el
 * drawer y la pestana Meet como extras de realismo. La bandeja se abre
 * primero (el nino encuentra el correo sin leer arriba); la home bar
 * cierra la app.
 */

import { useState } from 'react';
import type { Escenario, Veredicto } from '../../../types/escenario';
import type { TurnoChat } from '../../../llm';
import { StatusBar } from '../../telefono/StatusBar';
import { BandejaGm } from './BandejaGm';
import { CorreoGm } from './CorreoGm';
import { DrawerGm } from './DrawerGm';
import { MeetGm } from './MeetGm';
import { BarraInferiorGm } from './BarraInferiorGm';

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

export function GmailApp(props: Props) {
  const [correoAbierto, setCorreoAbierto] = useState(false);
  const [vista, setVista] = useState<'correo' | 'meet'>('correo');
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const { escenario, fase } = props;
  const enJuego = fase === 'mensaje' || fase === 'feedback' || fase === 'chat';

  let pantalla;
  if (correoAbierto && escenario && enJuego) {
    pantalla = (
      <CorreoGm
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
        onVolver={() => setCorreoAbierto(false)}
      />
    );
  } else if (vista === 'meet') {
    pantalla = (
      <div className="flex h-full flex-col bg-[var(--color-gm-fondo)]">
        <StatusBar claro={false} />
        <MeetGm onAbrirDrawer={() => setDrawerAbierto(true)} />
        <BarraInferiorGm activa="meet" onIrCorreo={() => setVista('correo')} onIrMeet={() => undefined} />
      </div>
    );
  } else {
    pantalla = (
      <BandejaGm
        escenario={enJuego ? escenario : null}
        sinLeer={fase === 'mensaje' && !correoAbierto}
        onAbrirEscenario={() => setCorreoAbierto(true)}
        onAbrirDrawer={() => setDrawerAbierto(true)}
        onIrMeet={() => setVista('meet')}
      />
    );
  }

  return (
    <div className="relative h-full">
      {pantalla}
      {drawerAbierto && <DrawerGm onCerrar={() => setDrawerAbierto(false)} />}
      {/* Home bar de iOS (oscura sobre app clara): vuelve al inicio */}
      <button
        type="button"
        aria-label="Ir a la pantalla de inicio"
        onClick={props.onCerrar}
        className="absolute bottom-0 left-1/2 z-30 flex h-6 w-44 -translate-x-1/2 items-end justify-center pb-1.5"
      >
        <span className="h-1 w-32 rounded-full bg-[var(--color-gm-texto)]/70" />
      </button>
    </div>
  );
}
