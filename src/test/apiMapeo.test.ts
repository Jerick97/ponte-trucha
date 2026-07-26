/**
 * El mapeo es la costura entre el contrato del backend y los tipos del juego.
 * Lo que se prueba aqui es la regla de oro: antes de responder no puede
 * filtrarse nada de la revelacion.
 */

import { describe, expect, it } from 'vitest';
import {
  canalDelReto,
  escenarioRevelado,
  escenarioVisible,
  rondaDesdeResultado,
  veredictoDesdeApi,
  veredictoHaciaApi,
} from '../api/mapeo';
import type { ResultadoIntentoApi, RetoApi } from '../api/tipos';

const RETO: RetoApi = {
  challengeId: 'challenge-1',
  appType: 'roblox',
  difficulty: 2,
  payload: {
    canal: 'chat-juego',
    dificultad: 2,
    remitente: { nombre: 'RobuxKing_Oficial', avatar: '👑', verificado: false },
    mensaje: 'Te regalo 10 000 Robux, solo pon tu contraseña',
  },
  validUntil: '2026-07-25T20:00:00Z',
};

const RESULTADO: ResultadoIntentoApi = {
  attemptId: 'attempt-1',
  challengeId: 'challenge-1',
  isCorrect: true,
  pointsAwarded: 125,
  score: 225,
  streak: 2,
  totalAttempts: 2,
  correctAttempts: 2,
  currentDifficulty: 2,
  signalCodes: ['tu-contrasena'],
  feedbackCode: 'nadie-te-pide-tu-clave',
  correctDecision: 'trap',
  scenarioType: 'robo-de-cuenta',
  signals: [{ fragment: 'tu contraseña', explanation: 'Nadie de verdad te pide tu clave.' }],
  lesson: 'Nadie que sea de verdad te pide tu clave.',
  allowsConversation: true,
  scammerProfile: { disguise: 'el admin del juego', tactics: ['prisa'], objective: 'la clave' },
};

describe('escenarioVisible', () => {
  it('usa el challengeId como id y respeta canal, remitente y mensaje', () => {
    const escenario = escenarioVisible(RETO);

    expect(escenario.id).toBe('challenge-1');
    expect(escenario.canal).toBe('chat-juego');
    expect(escenario.remitente.nombre).toBe('RobuxKing_Oficial');
    expect(escenario.mensaje).toContain('Robux');
    expect(escenario.dificultad).toBe(2);
  });

  it('no trae señales, leccion ni perfil del estafador antes de responder', () => {
    const escenario = escenarioVisible(RETO);

    expect(escenario.senales).toEqual([]);
    expect(escenario.leccion).toBe('');
    expect(escenario.permiteConversacion).toBe(false);
    expect(escenario.perfilEstafador).toBeUndefined();
  });

  it('conserva el asunto solo cuando el reto lo trae', () => {
    const conAsunto = escenarioVisible({
      ...RETO,
      appType: 'email',
      payload: { ...RETO.payload, canal: 'correo', asunto: 'Ganaste una tarjeta' },
    });

    expect(conAsunto.asunto).toBe('Ganaste una tarjeta');
    expect(escenarioVisible(RETO).asunto).toBeUndefined();
  });
});

describe('escenarioRevelado', () => {
  it('completa el escenario con lo que devolvio el intento', () => {
    const escenario = escenarioRevelado(escenarioVisible(RETO), RESULTADO);

    expect(escenario.tipo).toBe('robo-de-cuenta');
    expect(escenario.respuestaCorrecta).toBe('trampa');
    expect(escenario.senales[0].fragmento).toBe('tu contraseña');
    expect(escenario.senales[0].explicacion).toContain('clave');
    expect(escenario.leccion).toContain('clave');
    expect(escenario.permiteConversacion).toBe(true);
    expect(escenario.perfilEstafador?.disfraz).toBe('el admin del juego');
  });

  it('deja el escenario sin perfil cuando el mensaje era legitimo', () => {
    const legitimo = escenarioRevelado(escenarioVisible(RETO), {
      ...RESULTADO,
      correctDecision: 'legitimate',
      scenarioType: 'legitimo',
      allowsConversation: false,
      scammerProfile: null,
    });

    expect(legitimo.respuestaCorrecta).toBe('confianza');
    expect(legitimo.perfilEstafador).toBeUndefined();
    expect(legitimo.permiteConversacion).toBe(false);
  });

  it('cae a un tipo conocido si el backend manda uno nuevo', () => {
    const escenario = escenarioRevelado(escenarioVisible(RETO), {
      ...RESULTADO,
      scenarioType: 'familia-desconocida',
    });

    expect(escenario.tipo).toBe('legitimo');
  });
});

describe('canalDelReto', () => {
  it('usa el appType cuando el canal del payload no es conocido', () => {
    const canal = canalDelReto({
      ...RETO,
      appType: 'discord',
      payload: { ...RETO.payload, canal: 'inventado' },
    });

    expect(canal).toBe('discord');
  });
});

describe('veredictos y rondas', () => {
  it('traduce el veredicto en los dos sentidos', () => {
    expect(veredictoDesdeApi('trap')).toBe('trampa');
    expect(veredictoDesdeApi('legitimate')).toBe('confianza');
    expect(veredictoHaciaApi('trampa')).toBe('trap');
    expect(veredictoHaciaApi('confianza')).toBe('legitimate');
  });

  it('arma la ronda con el puntaje que calculo el servidor', () => {
    const ronda = rondaDesdeResultado('trampa', RESULTADO);

    expect(ronda).toEqual({
      escenarioId: 'challenge-1',
      respuesta: 'trampa',
      acerto: true,
      puntosGanados: 125,
      rachaDespues: 2,
    });
  });
});
