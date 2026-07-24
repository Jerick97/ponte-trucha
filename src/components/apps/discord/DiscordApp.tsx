/**
 * App de Discord del simulador: splash de carga -> vista Mensajes (el nino
 * encuentra el DM no leido) <-> conversacion del escenario. El servidor y
 * el perfil son visitables como en la app real.
 */

import { useEffect, useState } from 'react';
import type { Escenario, Veredicto } from '../../../types/escenario';
import type { TurnoChat } from '../../../llm';
import { SplashDc } from './SplashDc';
import { VistaServidor } from './VistaServidor';
import { ListaMensajes } from './ListaMensajes';
import { VistaPerfil } from './VistaPerfil';
import { ConversacionDc } from './ConversacionDc';

type Vista = 'splash' | 'mensajes' | 'servidor' | 'perfil' | 'conversacion';

/** Duracion del splash de carga (se salta si piden menos animacion). */
const MS_SPLASH = 1200;

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

export function DiscordApp(props: Props) {
  const [vista, setVista] = useState<Vista>('splash');
  const { escenario, fase } = props;
  const enJuego = fase === 'mensaje' || fase === 'feedback' || fase === 'chat';

  useEffect(() => {
    if (vista !== 'splash') return;
    const saltar = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    if (saltar) {
      setVista('mensajes');
      return;
    }
    const temporizador = setTimeout(() => setVista('mensajes'), MS_SPLASH);
    return () => clearTimeout(temporizador);
  }, [vista]);

  function pantalla() {
    if (vista === 'splash') return <SplashDc />;
    if (vista === 'perfil') return <VistaPerfil onCerrar={() => setVista('mensajes')} />;
    if (vista === 'servidor') {
      return (
        <VistaServidor
          dmsSinLeer={enJuego && fase === 'mensaje' && escenario ? 1 : 0}
          onIrMensajes={() => setVista('mensajes')}
          onAbrirPerfil={() => setVista('perfil')}
        />
      );
    }
    if (vista === 'conversacion' && escenario && enJuego) {
      return (
        <ConversacionDc
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
          onVolver={() => setVista('mensajes')}
        />
      );
    }
    return (
      <ListaMensajes
        escenario={enJuego ? escenario : null}
        sinLeer={!!escenario && enJuego && fase === 'mensaje' && vista !== 'conversacion'}
        onAbrirEscenario={() => setVista('conversacion')}
        onIrServidor={() => setVista('servidor')}
        onAbrirPerfil={() => setVista('perfil')}
      />
    );
  }

  return (
    <div className="relative h-full">
      {pantalla()}
      {/* Home bar de iOS: tocarla vuelve al inicio del telefono */}
      <button
        type="button"
        aria-label="Ir a la pantalla de inicio"
        onClick={props.onCerrar}
        className="absolute bottom-0 left-1/2 z-10 flex h-6 w-44 -translate-x-1/2 items-end justify-center pb-1.5"
      >
        <span className="h-1 w-32 rounded-full bg-[var(--color-lock-texto)]/70" />
      </button>
    </div>
  );
}
