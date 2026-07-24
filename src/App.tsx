/**
 * Orquestador: sincroniza la maquina del telefono (donde se ve) con las
 * fases de la partida (que se ve). Ninguna regla de juego vive aqui.
 */

import { useEffect, useReducer, useRef, useState } from 'react';
import { ESTADO_INICIAL, transicion } from './components/telefono/maquina';
import { precargarIconos } from './components/telefono/precargarIconos';
import { reproducirSonido } from './components/telefono/sonidos';
import { APPS, appPorCanal, type AppSimulada } from './components/telefono/apps';
import { Iphone } from './components/telefono/Iphone';
import { PantallaApagada } from './components/telefono/PantallaApagada';
import { AnimacionArranque } from './components/telefono/AnimacionArranque';
import { PantallaBloqueo } from './components/telefono/PantallaBloqueo';
import { HomeScreen } from './components/telefono/HomeScreen';
import { StatusBar } from './components/telefono/StatusBar';
import { VistaApp } from './components/apps/VistaApp';
import { WhatsAppApp } from './components/apps/whatsapp/WhatsAppApp';
import { DiscordApp } from './components/apps/discord/DiscordApp';
import { MensajesApp } from './components/apps/mensajes/MensajesApp';
import { RobloxApp } from './components/apps/roblox/RobloxApp';
import { GmailApp } from './components/apps/gmail/GmailApp';
import { CamaraApp } from './components/apps/camara/CamaraApp';
import { reproducirSonidoDc } from './components/apps/discord/sonidosDc';
import { reproducirSonidoWa } from './components/apps/whatsapp/sonidosWa';
import { reproducirSonidoRb } from './components/apps/roblox/sonidosRb';
import { reproducirSonidoGm } from './components/apps/gmail/sonidosGm';
import { Burbuja } from './components/Burbuja';
import { Confetti } from './components/Confetti';
import { MascotaRacha } from './components/MascotaRacha';
import { reproducirSonidoRacha, reproducirSonidoRachaRota } from './components/sonidoRacha';
import { BarraDecision } from './components/BarraDecision';
import { TarjetaFeedback } from './components/TarjetaFeedback';
import { ChatEstafador } from './components/ChatEstafador';
import { Hud } from './components/Hud';
import { PantallaResultado } from './components/PantallaResultado';
import { MAX_TURNOS_CHAT, usePartida } from './store/usePartida';
import { useAudio } from './store/audio';
import { leerRecord } from './store/record';

function prefiereMenosMovimiento(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

export default function App() {
  const [telefono, despachar] = useReducer(transicion, ESTADO_INICIAL);
  // Linterna: el boton vive en el lock y el flash en la parte trasera.
  const [linterna, setLinterna] = useState(false);
  // Cuantos aciertos ya festejamos, para no repetir el sonido en re-renders.
  const celebradas = useRef(0);

  // Los iconos se descargan mientras el nino ve la pantalla apagada.
  useEffect(precargarIconos, []);

  const fase = usePartida((s) => s.fase);
  const partida = usePartida((s) => s.partida);
  const ronda = usePartida((s) => s.ronda);
  const indice = usePartida((s) => s.indice);
  const chat = usePartida((s) => s.chat);
  const chatCargando = usePartida((s) => s.chatCargando);
  const escenario = usePartida((s) => s.escenarioActual());

  // Suena la alerta cada vez que llega un mensaje nuevo del escenario
  // (tambien con el telefono bloqueado, como en un celular real). Discord
  // y WhatsApp usan su tono propio; el resto, el del sistema.
  const idEscenario = escenario?.id;
  const canalEscenario = escenario?.canal;
  useEffect(() => {
    if (fase !== 'mensaje' || !idEscenario) return;
    if (canalEscenario === 'discord') reproducirSonidoDc('ping');
    else if (canalEscenario === 'whatsapp') reproducirSonidoWa('notificacion');
    else if (canalEscenario === 'chat-juego') reproducirSonidoRb('notificacion');
    else if (canalEscenario === 'correo') reproducirSonidoGm('notificacion');
    else reproducirSonido('notificacion');
  }, [fase, idEscenario, canalEscenario]);

  // Sonido de racha (tipo combo): suena una vez por acierto, subiendo de
  // tono con la racha. Se apoya en la cantidad de resultados para no repetir.
  useEffect(() => {
    const n = partida.resultados.length;
    if (n === 0) {
      celebradas.current = 0;
      return;
    }
    if (n !== celebradas.current && fase === 'feedback') {
      celebradas.current = n;
      const ultimo = partida.resultados[n - 1];
      if (ultimo.acerto) {
        reproducirSonidoRacha(partida.racha);
      } else {
        // Solo suena el "se apago la racha" si venia una racha que valia la pena.
        const rachaPrevia = partida.resultados[n - 2]?.rachaDespues ?? 0;
        if (rachaPrevia >= 3) reproducirSonidoRachaRota();
      }
    }
  }, [partida.resultados, partida.racha, fase]);

  const iniciar = usePartida((s) => s.iniciar);
  const responderEscenario = usePartida((s) => s.responderEscenario);
  const siguiente = usePartida((s) => s.siguiente);
  const abrirChat = usePartida((s) => s.abrirChat);
  const enviarMensajeAlEstafador = usePartida((s) => s.enviarMensajeAlEstafador);
  const reiniciar = usePartida((s) => s.reiniciar);
  const nivelFinal = usePartida((s) => s.nivelFinal);
  const medallasFinales = usePartida((s) => s.medallasFinales);
  const esRecord = usePartida((s) => s.esRecord);

  const silenciado = useAudio((s) => s.silenciado);
  const alternarSilencio = useAudio((s) => s.alternar);

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

  // Confeti al acertar: mas piezas cuanto mas larga la racha.
  const celebrar = fase === 'feedback' && ultimoResultado?.acerto === true;
  const piezasConfeti = 22 + Math.min(partida.racha, 6) * 6;

  function contenidoApp(app: AppSimulada) {
    if (app.id === 'mensajes') {
      return (
        <MensajesApp
          escenario={appDelEscenario?.id === 'mensajes' && escenario ? escenario : null}
          fase={fase}
          ultimoResultado={ultimoResultado ?? null}
          turnos={chat}
          chatCargando={chatCargando}
          chatAgotado={turnosDelNino >= MAX_TURNOS_CHAT}
          onResponder={responderEscenario}
          onChatear={abrirChat}
          onSiguiente={avanzar}
          onEnviar={enviarMensajeAlEstafador}
          onCerrar={() => despachar({ tipo: 'CERRAR_APP' })}
        />
      );
    }
    if (app.id === 'chat-juego') {
      return (
        <RobloxApp
          escenario={appDelEscenario?.id === 'chat-juego' && escenario ? escenario : null}
          fase={fase}
          ultimoResultado={ultimoResultado ?? null}
          turnos={chat}
          chatCargando={chatCargando}
          chatAgotado={turnosDelNino >= MAX_TURNOS_CHAT}
          onResponder={responderEscenario}
          onChatear={abrirChat}
          onSiguiente={avanzar}
          onEnviar={enviarMensajeAlEstafador}
          onCerrar={() => despachar({ tipo: 'CERRAR_APP' })}
        />
      );
    }
    if (app.id === 'gmail') {
      return (
        <GmailApp
          escenario={appDelEscenario?.id === 'gmail' && escenario ? escenario : null}
          fase={fase}
          ultimoResultado={ultimoResultado ?? null}
          turnos={chat}
          chatCargando={chatCargando}
          chatAgotado={turnosDelNino >= MAX_TURNOS_CHAT}
          onResponder={responderEscenario}
          onChatear={abrirChat}
          onSiguiente={avanzar}
          onEnviar={enviarMensajeAlEstafador}
          onCerrar={() => despachar({ tipo: 'CERRAR_APP' })}
        />
      );
    }
    if (app.id === 'discord') {
      return (
        <DiscordApp
          escenario={appDelEscenario?.id === 'discord' && escenario ? escenario : null}
          fase={fase}
          ultimoResultado={ultimoResultado ?? null}
          turnos={chat}
          chatCargando={chatCargando}
          chatAgotado={turnosDelNino >= MAX_TURNOS_CHAT}
          onResponder={responderEscenario}
          onChatear={abrirChat}
          onSiguiente={avanzar}
          onEnviar={enviarMensajeAlEstafador}
          onCerrar={() => despachar({ tipo: 'CERRAR_APP' })}
        />
      );
    }
    if (app.id === 'whatsapp') {
      return (
        <WhatsAppApp
          escenario={appDelEscenario?.id === 'whatsapp' && escenario ? escenario : null}
          fase={fase}
          ultimoResultado={ultimoResultado ?? null}
          turnos={chat}
          chatCargando={chatCargando}
          chatAgotado={turnosDelNino >= MAX_TURNOS_CHAT}
          onResponder={responderEscenario}
          onChatear={abrirChat}
          onSiguiente={avanzar}
          onEnviar={enviarMensajeAlEstafador}
          onCerrar={() => despachar({ tipo: 'CERRAR_APP' })}
        />
      );
    }
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
          onEncender={() => {
            reproducirSonido('encendido');
            despachar({ tipo: 'ENCENDER', saltarAnimacion: prefiereMenosMovimiento() });
          }}
        />
      );
    }
    if (telefono.energia === 'encendiendo') {
      return <AnimacionArranque onFin={() => despachar({ tipo: 'FIN_ANIMACION' })} />;
    }
    // La camara es app del sistema (sin canal) y se evalua antes que el
    // bloqueo: desde el lock se abre sin desbloquear y al cerrarla se
    // vuelve al lock, como en iOS.
    if (telefono.appAbierta === 'camara') {
      return <CamaraApp onCerrar={() => despachar({ tipo: 'CERRAR_APP' })} />;
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
                texto: (() => {
                  const record = leerRecord();
                  return record
                    ? `Tu récord: ${record.nivelEmoji} ${record.nivelTitulo} · ${record.puntaje} pts. ¡Supéralo!`
                    : 'Desliza hacia arriba y aprende a detectar mensajes trucha';
                })(),
              }
            : null;
      return (
        <PantallaBloqueo
          onDesbloquear={desbloquear}
          linterna={linterna}
          onAlternarLinterna={() => setLinterna(!linterna)}
          onAbrirCamara={() => despachar({ tipo: 'ABRIR_APP', app: 'camara' })}
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
            <PantallaResultado
              partida={partida}
              nivel={nivelFinal()}
              medallas={medallasFinales()}
              esRecord={esRecord}
              onReiniciar={jugarOtraVez}
            />
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
        onAbrirCamara={() => despachar({ tipo: 'ABRIR_APP', app: 'camara' })}
      />
    );
  }

  return (
    <div className="relative h-full py-2">
      <button
        type="button"
        onClick={alternarSilencio}
        aria-label={silenciado ? 'Activar sonido' : 'Silenciar sonido'}
        aria-pressed={silenciado}
        className="absolute right-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-carcasa)] text-base opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-marca-500)]"
      >
        <span aria-hidden="true">{silenciado ? '🔇' : '🔊'}</span>
      </button>
      <Iphone
        girado={telefono.girado}
        arrancando={telefono.energia === 'encendiendo'}
        puedeGirar={telefono.energia === 'encendido'}
        puedeBloquear={telefono.energia === 'encendido' && !telefono.bloqueado}
        linternaEncendida={linterna}
        onGirar={() => despachar({ tipo: 'GIRAR' })}
        onBloquear={() => {
          reproducirSonido('bloqueo');
          despachar({ tipo: 'BLOQUEAR' });
        }}
      >
        {pantalla()}
        {celebrar && <Confetti key={escenario?.id ?? 'confeti'} piezas={piezasConfeti} />}
        {celebrar && <MascotaRacha key={`m-${escenario?.id ?? 'x'}`} racha={partida.racha} />}
      </Iphone>
    </div>
  );
}
