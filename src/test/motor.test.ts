import { describe, expect, it } from 'vitest';
import {
  armarRonda,
  calcularPuntos,
  crearPartida,
  responder,
  BONUS_POR_RACHA,
  MAX_BONUS_RACHA,
  PUNTOS_ACIERTO,
} from '../game/motor';
import { calcularNivel } from '../game/nivelTrucha';
import banco from '../data/escenarios.json';
import type { BancoEscenarios, Escenario } from '../types/escenario';

const BANCO = banco as BancoEscenarios;

function escenarioDePrueba(parcial: Partial<Escenario> = {}): Escenario {
  return {
    id: 'prueba',
    tipo: 'monedas-gratis',
    canal: 'chat-juego',
    dificultad: 1,
    remitente: { nombre: 'Test', avatar: '🤖', verificado: false },
    mensaje: 'Dame tu contrasena y te doy monedas',
    respuestaCorrecta: 'trampa',
    senales: [{ fragmento: 'contrasena', explicacion: 'Nadie pide tu contrasena.' }],
    leccion: 'Nunca compartas tu contrasena.',
    permiteConversacion: false,
    ...parcial,
  };
}

describe('motor de partida', () => {
  it('suma puntos base al acertar sin racha previa', () => {
    const estado = responder(crearPartida(), escenarioDePrueba(), 'trampa');
    expect(estado.puntaje).toBe(PUNTOS_ACIERTO);
    expect(estado.racha).toBe(1);
    expect(estado.aciertos).toBe(1);
  });

  it('reinicia la racha al fallar pero conserva la mejor racha', () => {
    let estado = crearPartida();
    estado = responder(estado, escenarioDePrueba(), 'trampa');
    estado = responder(estado, escenarioDePrueba(), 'trampa');
    estado = responder(estado, escenarioDePrueba(), 'confianza');

    expect(estado.racha).toBe(0);
    expect(estado.mejorRacha).toBe(2);
    expect(estado.fallos).toBe(1);
  });

  it('topea el bonus de racha', () => {
    expect(calcularPuntos(1)).toBe(PUNTOS_ACIERTO + BONUS_POR_RACHA);
    expect(calcularPuntos(99)).toBe(PUNTOS_ACIERTO + MAX_BONUS_RACHA);
  });

  it('marca correcto responder confianza a un mensaje legitimo', () => {
    const legitimo = escenarioDePrueba({ tipo: 'legitimo', respuestaCorrecta: 'confianza' });
    const estado = responder(crearPartida(), legitimo, 'confianza');
    expect(estado.aciertos).toBe(1);
  });
});

describe('armado de ronda', () => {
  it('siempre incluye al menos un mensaje legitimo', () => {
    const ronda = armarRonda(BANCO.escenarios, 6);
    expect(ronda.some((e) => e.tipo === 'legitimo')).toBe(true);
  });

  it('ordena de menor a mayor dificultad', () => {
    const dificultades = armarRonda(BANCO.escenarios, 6).map((e) => e.dificultad);
    expect([...dificultades].sort((a, b) => a - b)).toEqual(dificultades);
  });

  it('no repite escenarios', () => {
    const ids = armarRonda(BANCO.escenarios, 6).map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('nivel de trucha', () => {
  it('da super trucha con 100% de aciertos', () => {
    let estado = crearPartida();
    for (let i = 0; i < 5; i++) estado = responder(estado, escenarioDePrueba(), 'trampa');
    expect(calcularNivel(estado).clave).toBe('super-trucha');
  });

  it('da novato con todo fallado', () => {
    let estado = crearPartida();
    for (let i = 0; i < 5; i++) estado = responder(estado, escenarioDePrueba(), 'confianza');
    expect(calcularNivel(estado).clave).toBe('novato');
  });
});
