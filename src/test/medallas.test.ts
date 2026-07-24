import { describe, it, expect } from 'vitest';
import { calcularMedallas } from '../game/medallas';
import type { EstadoPartida, ResultadoRonda } from '../game/motor';
import type { Escenario, TipoEscenario } from '../types/escenario';

function escenario(id: string, tipo: TipoEscenario): Escenario {
  return {
    id,
    tipo,
    canal: 'sms',
    dificultad: 1,
    remitente: { nombre: 'x', avatar: 'x', verificado: false },
    mensaje: 'mensaje de prueba',
    respuestaCorrecta: tipo === 'legitimo' ? 'confianza' : 'trampa',
    senales: [{ fragmento: 'x', explicacion: 'explicacion de prueba' }],
    leccion: 'leccion de prueba',
    permiteConversacion: false,
  };
}

function resultado(escenarioId: string, acerto: boolean): ResultadoRonda {
  return { escenarioId, respuesta: 'trampa', acerto, puntosGanados: acerto ? 100 : 0, rachaDespues: 0 };
}

function partida(over: Partial<EstadoPartida>): EstadoPartida {
  return { puntaje: 0, racha: 0, mejorRacha: 0, aciertos: 0, fallos: 0, resultados: [], ...over };
}

describe('calcularMedallas', () => {
  it('no da medallas en una partida vacia', () => {
    expect(calcularMedallas(partida({}), [])).toEqual([]);
  });

  it('da "Sin fallos" cuando no hubo ningun fallo', () => {
    const p = partida({ aciertos: 3, fallos: 0, mejorRacha: 3, resultados: [resultado('a', true)] });
    const medallas = calcularMedallas(p, [escenario('a', 'monedas-gratis')]);
    expect(medallas.some((m) => m.clave === 'sin-fallos')).toBe(true);
  });

  it('no da "Sin fallos" si hubo al menos un fallo', () => {
    const p = partida({ aciertos: 2, fallos: 1 });
    expect(calcularMedallas(p, []).some((m) => m.clave === 'sin-fallos')).toBe(false);
  });

  it('da "Racha de fuego" con racha de 5 o mas', () => {
    const p = partida({ aciertos: 6, fallos: 1, mejorRacha: 5 });
    expect(calcularMedallas(p, []).some((m) => m.clave === 'racha-fuego')).toBe(true);
  });

  it('da "Ojo fino" si acerto todos los legitimos', () => {
    const ronda = [
      escenario('l1', 'legitimo'),
      escenario('l2', 'legitimo'),
      escenario('e1', 'sorteo-falso'),
    ];
    const p = partida({
      aciertos: 3,
      fallos: 0,
      mejorRacha: 3,
      resultados: [resultado('l1', true), resultado('l2', true), resultado('e1', true)],
    });
    expect(calcularMedallas(p, ronda).some((m) => m.clave === 'ojo-fino')).toBe(true);
  });

  it('no da "Ojo fino" si confundio un legitimo con trampa', () => {
    const ronda = [escenario('l1', 'legitimo'), escenario('l2', 'legitimo')];
    const p = partida({
      aciertos: 1,
      fallos: 1,
      resultados: [resultado('l1', true), resultado('l2', false)],
    });
    expect(calcularMedallas(p, ronda).some((m) => m.clave === 'ojo-fino')).toBe(false);
  });
});
