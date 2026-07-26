/**
 * Traduce los contratos del API a los tipos que ya usa el juego.
 *
 * El backend entrega el reto en dos tiempos, a proposito:
 *
 * 1. `GET .../retos/siguiente` -> solo lo visible (remitente, mensaje, asunto).
 *    Nada de tipo, señales, leccion ni perfil del estafador: seria una pista.
 * 2. `POST .../intentos` -> la revelacion, recien cuando el niño ya decidio.
 *
 * `escenarioVisible()` cubre el paso 1 con marcadores neutros, y
 * `escenarioRevelado()` completa el escenario con lo que devolvio el intento.
 * La UI de feedback no cambia: sigue recibiendo un `Escenario` completo.
 */

import type {
  CanalMensaje,
  Dificultad,
  Escenario,
  SenalDelatora,
  TipoEscenario,
  Veredicto,
} from '../types/escenario';
import type { EstadoPartida, ResultadoRonda } from '../game/motor';
import type { AppTypeApi, ResultadoIntentoApi, RetoApi, VeredictoApi } from './tipos';

const CANALES: readonly CanalMensaje[] = ['chat-juego', 'whatsapp', 'correo', 'discord', 'sms'];

const CANAL_POR_APP: Record<AppTypeApi, CanalMensaje> = {
  whatsapp: 'whatsapp',
  sms: 'sms',
  email: 'correo',
  roblox: 'chat-juego',
  discord: 'discord',
};

const TIPOS: readonly TipoEscenario[] = [
  'monedas-gratis',
  'sorteo-falso',
  'robo-de-cuenta',
  'hack-con-virus',
  'link-tramposo',
  'suplantacion-de-amigo',
  'legitimo',
];

/** El canal viaja en el payload; el `appType` es el respaldo si no coincide. */
export function canalDelReto(reto: RetoApi): CanalMensaje {
  const canal = reto.payload.canal as CanalMensaje;
  return CANALES.includes(canal) ? canal : CANAL_POR_APP[reto.appType];
}

function dificultadValida(valor: number): Dificultad {
  if (valor === 2 || valor === 3) return valor;
  return 1;
}

function tipoValido(valor: string): TipoEscenario {
  return TIPOS.includes(valor as TipoEscenario) ? (valor as TipoEscenario) : 'legitimo';
}

export function veredictoDesdeApi(decision: VeredictoApi): Veredicto {
  return decision === 'trap' ? 'trampa' : 'confianza';
}

export function veredictoHaciaApi(veredicto: Veredicto): VeredictoApi {
  return veredicto === 'trampa' ? 'trap' : 'legitimate';
}

/**
 * Escenario tal como se puede mostrar ANTES de responder.
 *
 * `tipo`, `respuestaCorrecta`, `senales`, `leccion` y `permiteConversacion` son
 * marcadores neutros: el servidor no los envio todavia. La UI no los usa en la
 * fase `mensaje`, y el store los reemplaza con `escenarioRevelado()` antes de
 * pasar a `feedback`.
 */
export function escenarioVisible(reto: RetoApi): Escenario {
  return {
    id: reto.challengeId,
    tipo: 'legitimo',
    canal: canalDelReto(reto),
    dificultad: dificultadValida(reto.difficulty),
    remitente: reto.payload.remitente,
    mensaje: reto.payload.mensaje,
    ...(reto.payload.asunto === undefined ? {} : { asunto: reto.payload.asunto }),
    respuestaCorrecta: 'confianza',
    senales: [],
    leccion: '',
    permiteConversacion: false,
  };
}

/** Completa el escenario con la revelacion que devolvio el intento. */
export function escenarioRevelado(
  visible: Escenario,
  resultado: ResultadoIntentoApi,
): Escenario {
  const senales: SenalDelatora[] = resultado.signals.map((senal) => ({
    fragmento: senal.fragment,
    explicacion: senal.explanation,
  }));
  const perfil = resultado.scammerProfile;

  return {
    ...visible,
    tipo: tipoValido(resultado.scenarioType),
    respuestaCorrecta: veredictoDesdeApi(resultado.correctDecision),
    senales,
    leccion: resultado.lesson,
    permiteConversacion: resultado.allowsConversation,
    ...(perfil === null
      ? {}
      : {
          perfilEstafador: {
            disfraz: perfil.disguise,
            tacticas: perfil.tactics,
            objetivo: perfil.objective,
          },
        }),
  };
}

/** Resultado de ronda con el puntaje que calculo el servidor. */
export function rondaDesdeResultado(
  respuesta: Veredicto,
  resultado: ResultadoIntentoApi,
): ResultadoRonda {
  return {
    escenarioId: resultado.challengeId,
    respuesta,
    acerto: resultado.isCorrect,
    puntosGanados: resultado.pointsAwarded,
    rachaDespues: resultado.streak,
  };
}

/**
 * Acumula una ronda calificada por el servidor en el estado de la partida.
 *
 * El equivalente local es `responder()` de `src/game/motor.ts`, que ademas
 * decide si acerto y cuantos puntos vale. Aqui no se decide nada: puntos, racha
 * y acierto llegan del backend (R4: el puntaje es autoritativo del servidor) y
 * esta funcion solo lleva la cuenta de la partida en curso.
 */
export function partidaConRondaRemota(
  estado: EstadoPartida,
  ronda: ResultadoRonda,
): EstadoPartida {
  return {
    puntaje: estado.puntaje + ronda.puntosGanados,
    racha: ronda.rachaDespues,
    mejorRacha: Math.max(estado.mejorRacha, ronda.rachaDespues),
    aciertos: estado.aciertos + (ronda.acerto ? 1 : 0),
    fallos: estado.fallos + (ronda.acerto ? 0 : 1),
    resultados: [...estado.resultados, ronda],
  };
}
