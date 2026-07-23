/**
 * Orquestador: sincroniza la maquina del telefono (donde se ve) con las
 * fases de la partida (que se ve). Ninguna regla de juego vive aqui.
 */

import { useEffect, useReducer } from 'react';
import { ESTADO_INICIAL, transicion } from './components/telefono/maquina';
import { precargarIconos } from './components/telefono/precargarIconos';
import { APPS, appPorCanal, type AppSimulada } from './components/telefono/apps';
import { Iphone } from './components/telefono/Iphone';
import { PantallaApagada } from './components/telefono/PantallaApagada';
import { AnimacionArranque } from './components/telefono/AnimacionArranque';
import { PantallaBloqueo } from './components/telefono/PantallaBloqueo';
import { HomeScreen } from './components/telefono/HomeScreen';
import { StatusBar } from './components/telefono/StatusBar';
import { VistaApp } from './components/apps/VistaApp';
import { Burbuja } from './components/Burbuja';
import { BarraDecision } from './components/BarraDecision';
import { TarjetaFeedback } from './components/TarjetaFeedback';
import { ChatEstafador } from './components/ChatEstafador';
import { Hud } from './components/Hud';
import { PantallaResultado } from './components/PantallaResultado';
import { MAX_TURNOS_CHAT, usePartida } from './store/usePartida';

function prefiereMenosMovimiento(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

export default function App() {
  const [telefono, despachar] = useReducer(transicion, ESTADO_INICIAL);

  // Los iconos se descargan mientras el nino ve la pantalla apagada.
  useEffect(precargarIconos, []);

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

  const enPartida = fase === 'mensaje' || fase === 'feedback' || fase === 'chat';
  const appDelEscenario = enPartida && escenario ? appPorCanal(escenario.canal) : null;
  const appAbierta = APPS.find((app) => app.id === telefono.appAbierta) ?? null;

  const desbloquear = () => {
    despachar({ tipo: 'DESBLOQUEAR' });
    if (fase === 'inicio') iniciar();
  };
  const avanzar = () => {
    despachar({ tipo: 'CERRAR_APP' });
    siguiente();
  };
  const jugarOtraVez = () => {
    despachar({ tipo: 'CERRAR_APP' });
    reiniciar();
    iniciar();
  };

  const hud = enPartida && fase !== 'chat' ? (
    <Hud ronda={indice + 1} totalRondas={ronda.length} puntaje={partida.puntaje} racha={partida.racha} />
  ) : undefined;

  const ultimoResultado = partida.resultados[partida.resultados.length - 1];
  const turnosDelNino = chat.filter((t) => t.autor === 'nino').length;

  function contenidoApp(app: AppSimulada) {
    const conMensaje = appDelEscenario?.id === app.id && escenario;
    if (!conMensaje) {
      return (
        <VistaApp app={app} titulo={app.nombre} onVolver={() => despachar({ tipo: 'CERRAR_APP' })}>
          <p className="pt-8 text-center text-[var(--color-texto-suave)]">
            No hay mensajes nuevos por aqui
          </p>
        </VistaApp>
      );
    }
    return (
      <VistaApp
        app={app}
        titulo={escenario.remitente.nombre}
        subtitulo={
          fase === 'chat'
            ? 'en linea'
            : escenario.remitente.verificado
              ? 'cuenta “verificada”'
              : 'desconocido'
        }
        avatar={escenario.remitente.avatar}
        onVolver={() => despachar({ tipo: 'CERRAR_APP' })}
      >
        {hud}
        <Burbuja
          texto={escenario.mensaje}
          senalesResaltadas={fase === 'feedback' ? escenario.senales : undefined}
        />
        {fase === 'mensaje' && <BarraDecision onResponder={responderEscenario} />}
        {fase === 'feedback' && ultimoResultado && (
          <TarjetaFeedback
            escenario={escenario}
            acerto={ultimoResultado.acerto}
            puntosGanados={ultimoResultado.puntosGanados}
            onChatear={abrirChat}
            onSiguiente={avanzar}
          />
        )}
        {fase === 'chat' && (
          <ChatEstafador
            turnos={chat}
            cargando={chatCargando}
            agotado={turnosDelNino >= MAX_TURNOS_CHAT}
            onEnviar={enviarMensajeAlEstafador}
            onTerminar={avanzar}
          />
        )}
      </VistaApp>
    );
  }

  function pantalla() {
    if (telefono.energia === 'apagado') {
      return (
        <PantallaApagada
          onEncender={() => despachar({ tipo: 'ENCENDER', saltarAnimacion: prefiereMenosMovimiento() })}
        />
      );
    }
    if (telefono.energia === 'encendiendo') {
      return <AnimacionArranque onFin={() => despachar({ tipo: 'FIN_ANIMACION' })} />;
    }
    if (telefono.bloqueado) {
      const notificacionBloqueo =
        enPartida && fase === 'mensaje' && escenario && appDelEscenario
          ? {
              imagen: appDelEscenario.icono,
              imagenConFondo: appDelEscenario.iconoConFondo,
              claseImagen: appDelEscenario.claseIcono,
              titulo: escenario.remitente.nombre,
              app: appDelEscenario.nombre,
              texto: escenario.mensaje,
            }
          : fase === 'inicio'
            ? {
                titulo: 'Ponte Trucha',
                app: 'Ponte Trucha',
                texto: 'Desliza hacia arriba y aprende a detectar mensajes trucha',
              }
            : null;
      return (
        <PantallaBloqueo
          onDesbloquear={desbloquear}
          notificacion={notificacionBloqueo}
          onAbrirNotificacion={() => {
            desbloquear();
            if (appDelEscenario) despachar({ tipo: 'ABRIR_APP', app: appDelEscenario.id });
          }}
        />
      );
    }
    if (fase === 'resultado') {
      return (
        <div className="wallpaper flex h-full flex-col">
          <StatusBar claro />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <PantallaResultado partida={partida} nivel={nivelFinal()} onReiniciar={jugarOtraVez} />
          </div>
        </div>
      );
    }
    if (appAbierta) return contenidoApp(appAbierta);
    return (
      <HomeScreen
        notificacion={
          fase === 'mensaje' && escenario && appDelEscenario
            ? { app: appDelEscenario, remitente: escenario.remitente.nombre, mensaje: escenario.mensaje }
            : null
        }
        hud={hud}
        onAbrirApp={(app) => despachar({ tipo: 'ABRIR_APP', app: app.id })}
      />
    );
  }

  return (
    <div className="h-full py-2">
      <Iphone
        girado={telefono.girado}
        arrancando={telefono.energia === 'encendiendo'}
        puedeGirar={telefono.energia === 'encendido'}
        puedeBloquear={telefono.energia === 'encendido' && !telefono.bloqueado}
        onGirar={() => despachar({ tipo: 'GIRAR' })}
        onBloquear={() => despachar({ tipo: 'BLOQUEAR' })}
      >
        {pantalla()}
      </Iphone>
    </div>
  );
}
