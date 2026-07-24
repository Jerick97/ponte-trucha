/**
 * App de Roblox del simulador: splash del icono -> pantalla "Cargando" ->
 * Home con juegos reales <-> Equipo (chats), donde vive el escenario. El
 * sidebar y el detalle de juego son visitables como en la app real.
 */

import { useEffect, useState } from 'react';
import type { Escenario, Veredicto } from '../../../types/escenario';
import type { TurnoChat } from '../../../llm';
import type { JuegoRb } from './datosJuegos';
import { SplashRb } from './SplashRb';
import { HomeRb } from './HomeRb';
import { SidebarRb } from './SidebarRb';
import { DetalleJuegoRb } from './DetalleJuegoRb';
import { EquipoRb } from './EquipoRb';
import { ConversacionRb } from './ConversacionRb';

type Vista = 'splash' | 'cargando' | 'inicio' | 'equipo' | 'conversacion';

/** Duraciones de las dos pantallas de carga (se saltan con reduced motion). */
const MS_SPLASH = 900;
const MS_CARGANDO = 1100;

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

export function RobloxApp(props: Props) {
  const [vista, setVista] = useState<Vista>('splash');
  const [conSidebar, setConSidebar] = useState(false);
  const [juegoAbierto, setJuegoAbierto] = useState<JuegoRb | null>(null);
  const { escenario, fase } = props;
  const enJuego = fase === 'mensaje' || fase === 'feedback' || fase === 'chat';
  const sinLeer = !!escenario && enJuego && fase === 'mensaje' && vista !== 'conversacion';

  useEffect(() => {
    if (vista !== 'splash' && vista !== 'cargando') return;
    const saltar = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    if (saltar) {
      setVista('inicio');
      return;
    }
    const temporizador = setTimeout(
      () => setVista(vista === 'splash' ? 'cargando' : 'inicio'),
      vista === 'splash' ? MS_SPLASH : MS_CARGANDO,
    );
    return () => clearTimeout(temporizador);
  }, [vista]);

  const irEquipo = () => {
    setConSidebar(false);
    setJuegoAbierto(null);
    setVista('equipo');
  };

  function pantalla() {
    if (vista === 'splash' || vista === 'cargando') return <SplashRb etapa={vista === 'splash' ? 'icono' : 'cargando'} />;
    if (vista === 'conversacion' && escenario && enJuego) {
      return (
        <ConversacionRb
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
          onVolver={() => setVista('equipo')}
        />
      );
    }
    if (vista === 'equipo') {
      return (
        <EquipoRb
          escenario={enJuego ? escenario : null}
          sinLeer={sinLeer}
          onAbrirEscenario={() => setVista('conversacion')}
          onIrInicio={() => setVista('inicio')}
        />
      );
    }
    return (
      <HomeRb
        sinLeer={sinLeer}
        onAbrirSidebar={() => setConSidebar(true)}
        onIrEquipo={irEquipo}
        onAbrirJuego={setJuegoAbierto}
      />
    );
  }

  const cargandoApp = vista === 'splash' || vista === 'cargando';

  return (
    <div className="relative h-full">
      {pantalla()}
      {/* Detalle de juego: modal que crece desde abajo sobre el Home */}
      {juegoAbierto && vista === 'inicio' && (
        <DetalleJuegoRb
          key={juegoAbierto.id}
          juego={juegoAbierto}
          onCerrar={() => setJuegoAbierto(null)}
          onAbrirJuego={setJuegoAbierto}
        />
      )}
      {conSidebar && vista === 'inicio' && !juegoAbierto && (
        <SidebarRb sinLeer={sinLeer} onIrMensajes={irEquipo} onCerrar={() => setConSidebar(false)} />
      )}
      {/* Home bar de iOS: tocarla vuelve al inicio del telefono */}
      <button
        type="button"
        aria-label="Ir a la pantalla de inicio"
        onClick={props.onCerrar}
        className="absolute bottom-0 left-1/2 z-30 flex h-6 w-44 -translate-x-1/2 items-end justify-center pb-1.5"
      >
        <span
          className={`h-1 w-32 rounded-full ${
            cargandoApp ? 'bg-[var(--color-sms-texto)]/70' : 'bg-[var(--color-lock-texto)]/70'
          }`}
        />
      </button>
    </div>
  );
}
