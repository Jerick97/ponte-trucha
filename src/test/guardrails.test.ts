import { describe, expect, it } from 'vitest';
import { filtrarRespuesta, recortarPalabras } from '../llm/guardrails';

describe('guardrails del estafador conversacional', () => {
  it('bloquea peticiones de datos personales', () => {
    const resultado = filtrarRespuesta('Oye, dime donde vives y te mando el premio');
    expect(resultado.filtrada).toBe(true);
    expect(resultado.texto).not.toContain('donde vives');
  });

  it('bloquea propuestas de encontrarse', () => {
    expect(filtrarRespuesta('Podemos vernos en persona manana').filtrada).toBe(true);
  });

  it('detecta terminos prohibidos con tildes', () => {
    expect(filtrarRespuesta('Dime dónde vives pues').filtrada).toBe(true);
  });

  it('reemplaza respuestas vacias por guion seguro', () => {
    const resultado = filtrarRespuesta('   ');
    expect(resultado.filtrada).toBe(true);
    expect(resultado.texto.length).toBeGreaterThan(0);
  });

  it('deja pasar presion normal de estafa', () => {
    const resultado = filtrarRespuesta('Apurate que la promo se acaba en 5 minutos');
    expect(resultado.filtrada).toBe(false);
  });

  it('limpia el prefijo del rol si el modelo lo agrega', () => {
    expect(filtrarRespuesta('Estafador: ya pues, apurate').texto).toBe('ya pues, apurate');
  });

  it('recorta respuestas largas y marca el corte', () => {
    const largo = Array.from({ length: 50 }, () => 'palabra').join(' ');
    const recortado = recortarPalabras(largo, 10);
    expect(recortado.split(' ')).toHaveLength(10);
    expect(recortado.endsWith('...')).toBe(true);
  });

  it('no toca respuestas que ya son cortas', () => {
    expect(recortarPalabras('apurate pues', 10)).toBe('apurate pues');
  });
});
