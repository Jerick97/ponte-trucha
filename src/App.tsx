/**
 * Orquestador de fases. Solo decide que pantalla se ve;
 * ninguna regla de juego vive aqui.
 */

import { MarcoTelefono } from './components/MarcoTelefono';
import { Burbuja } from './components/Burbuja';
import { BarraDecision } from './components/BarraDecision';
import { TarjetaFeedback } from './components/TarjetaFeedback';
import { ChatEstafador } from './components/ChatEstafador';
import { PantallaInicio } from './components/PantallaInicio';
import { PantallaResultado } from './components/PantallaResultado';
import { Hud } from './components/Hud';
import { MAX_TURNOS_CHAT, usePartida } from './store/usePartida';

export default function App() {
  const fase = usePartida((s) => s.fase);
  const partida = usePartida((s) => s.partida);
  const ronda = usePartida((s) => s.ronda);
  const indice = usePartida((s) => s.indice);
  const chat = usePartida((s) => s.chat);
  const chatCargando = usePartida((s) => s.chatCargando);
  const escenario = usePartida((s) => s.escenarioActual());

  const iniciar = usePartida((s) => s.iniciar);
  const responderEscenario = usePartida((s) => s.responderEscenario);
  const siguiente = usePartida((s) => s.siguiente);
  const abrirChat = usePartida((s) => s.abrirChat);
  const enviarMensajeAlEstafador = usePartida((s) => s.enviarMensajeAlEstafador);
  const reiniciar = usePartida((s) => s.reiniciar);
  const nivelFinal = usePartida((s) => s.nivelFinal);

  if (fase === 'inicio') {
    return (
      <MarcoTelefono titulo="Ponte Trucha Kids" avatar="🐟">
        <PantallaInicio onJugar={iniciar} />
      </MarcoTelefono>
    );
  }

  if (fase === 'resultado') {
    return (
      <MarcoTelefono titulo="Resultado" avatar="🏁">
        <PantallaResultado partida={partida} nivel={nivelFinal()} onReiniciar={reiniciar} />
      </MarcoTelefono>
    );
  }

  if (!escenario) return null;

  const ultimoResultado = partida.resultados[partida.resultados.length - 1];
  const turnosDelNino = chat.filter((t) => t.autor === 'nino').length;

  if (fase === 'chat') {
    return (
      <MarcoTelefono
        titulo={escenario.remitente.nombre}
        subtitulo="en línea"
        avatar={escenario.remitente.avatar}
      >
        <Burbuja texto={escenario.mensaje} />
        <ChatEstafador
          turnos={chat}
          cargando={chatCargando}
          agotado={turnosDelNino >= MAX_TURNOS_CHAT}
          onEnviar={enviarMensajeAlEstafador}
          onTerminar={siguiente}
        />
      </MarcoTelefono>
    );
  }

  return (
    <MarcoTelefono
      titulo={escenario.remitente.nombre}
      subtitulo={escenario.remitente.verificado ? 'cuenta “verificada”' : 'desconocido'}
      avatar={escenario.remitente.avatar}
      pie={fase === 'mensaje' ? <BarraDecision onResponder={responderEscenario} /> : undefined}
    >
      <Hud
        ronda={indice + 1}
        totalRondas={ronda.length}
        puntaje={partida.puntaje}
        racha={partida.racha}
      />

      <Burbuja
        texto={escenario.mensaje}
        senalesResaltadas={fase === 'feedback' ? escenario.senales : undefined}
      />

      {fase === 'feedback' && ultimoResultado && (
        <TarjetaFeedback
          escenario={escenario}
          acerto={ultimoResultado.acerto}
          puntosGanados={ultimoResultado.puntosGanados}
          onChatear={abrirChat}
          onSiguiente={siguiente}
        />
      )}
    </MarcoTelefono>
  );
}
