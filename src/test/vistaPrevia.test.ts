import { describe, expect, it } from 'vitest';
import { LARGO_VISTA_PREVIA, recortarVistaPrevia } from '../components/telefono/vistaPrevia';

const MENSAJE_LARGO =
  'Hola campeon, soy el admin oficial del juego y tenemos un premio especial ' +
  'esperandote, solo tienes que mandarme tu contrasena y el codigo que te llego';

describe('vista previa del banner de notificacion', () => {
  it('deja intacto un mensaje corto, sin elipsis', () => {
    expect(recortarVistaPrevia('Hola, ¿juegas hoy?')).toBe('Hola, ¿juegas hoy?');
  });

  it('deja intacto un mensaje de exactamente el largo maximo', () => {
    const justo = 'a'.repeat(LARGO_VISTA_PREVIA);
    expect(recortarVistaPrevia(justo)).toBe(justo);
  });

  it('recorta un mensaje largo y termina en elipsis', () => {
    const recorte = recortarVistaPrevia(MENSAJE_LARGO);
    expect(recorte.length).toBeLessThanOrEqual(LARGO_VISTA_PREVIA);
    expect(recorte.endsWith('…')).toBe(true);
  });

  it('corta en limite de palabra, nunca a mitad de una', () => {
    const recorte = recortarVistaPrevia(MENSAJE_LARGO);
    const sinElipsis = recorte.slice(0, -1);
    // Lo recortado es prefijo literal del mensaje...
    expect(MENSAJE_LARGO.startsWith(sinElipsis)).toBe(true);
    // ...que no termina en espacio ni parte la palabra siguiente.
    expect(sinElipsis.endsWith(' ')).toBe(false);
    expect(MENSAJE_LARGO.charAt(sinElipsis.length)).toBe(' ');
  });

  it('no se queda vacio con una sola palabra gigante: corta duro', () => {
    const palabraGigante = 'x'.repeat(LARGO_VISTA_PREVIA * 2);
    const recorte = recortarVistaPrevia(palabraGigante);
    expect(recorte.length).toBeLessThanOrEqual(LARGO_VISTA_PREVIA);
    expect(recorte.endsWith('…')).toBe(true);
    expect(recorte.length).toBeGreaterThan(1);
  });

  it('respeta un largo maximo personalizado', () => {
    const recorte = recortarVistaPrevia(MENSAJE_LARGO, 20);
    expect(recorte.length).toBeLessThanOrEqual(20);
    expect(recorte.endsWith('…')).toBe(true);
  });
});
