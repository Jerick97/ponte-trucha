import { describe, it, expect } from 'vitest';
import {
  ALIAS_CATALOGO,
  AVATARES_CATALOGO,
  BANDAS,
  crearPerfilInfantil,
  validarPerfil,
} from '../onboarding/perfilInfantil';

describe('catalogos', () => {
  // R4: alias y avatar salen de catalogo, nunca de texto libre.
  it('ofrece varios alias y avatares predefinidos', () => {
    expect(ALIAS_CATALOGO.length).toBeGreaterThanOrEqual(6);
    expect(AVATARES_CATALOGO.length).toBeGreaterThanOrEqual(6);
  });

  it('los alias no contienen nombres reales de persona ni espacios', () => {
    for (const a of ALIAS_CATALOGO) {
      expect(a.id).toMatch(/^[a-z0-9-]+$/);
      expect(a.etiqueta.length).toBeGreaterThan(0);
    }
  });

  it('ofrece exactamente las dos bandas del diseno', () => {
    expect(BANDAS.map((b) => b.clave)).toEqual(['8-10', '11-13']);
  });
});

describe('validarPerfil', () => {
  it('acepta una seleccion completa del catalogo', () => {
    const r = validarPerfil({
      aliasId: ALIAS_CATALOGO[0].id,
      avatarId: AVATARES_CATALOGO[0].id,
      banda: '8-10',
    });
    expect(r.valido).toBe(true);
  });

  it('rechaza un alias que no esta en el catalogo', () => {
    const r = validarPerfil({
      aliasId: 'juan-perez',
      avatarId: AVATARES_CATALOGO[0].id,
      banda: '8-10',
    });
    expect(r.valido).toBe(false);
  });

  it('rechaza un avatar que no esta en el catalogo', () => {
    const r = validarPerfil({
      aliasId: ALIAS_CATALOGO[0].id,
      avatarId: 'foto-subida',
      banda: '8-10',
    });
    expect(r.valido).toBe(false);
  });

  it('rechaza una banda invalida', () => {
    const r = validarPerfil({
      aliasId: ALIAS_CATALOGO[0].id,
      avatarId: AVATARES_CATALOGO[0].id,
      banda: '14-17' as never,
    });
    expect(r.valido).toBe(false);
  });
});

describe('crearPerfilInfantil', () => {
  const seleccion = {
    aliasId: ALIAS_CATALOGO[0].id,
    avatarId: AVATARES_CATALOGO[0].id,
    banda: '11-13' as const,
  };

  it('genera un id opaco distinto en cada llamada', () => {
    const a = crearPerfilInfantil(seleccion, '2026-07-24T12:00:00.000Z');
    const b = crearPerfilInfantil(seleccion, '2026-07-24T12:00:00.000Z');
    expect(a.childId).not.toBe(b.childId);
    expect(a.childId.length).toBeGreaterThanOrEqual(12);
  });

  // R4 + tabla de datos prohibidos de seguridad-infantil.md.
  it('el perfil solo contiene los campos minimos permitidos', () => {
    const p = crearPerfilInfantil(seleccion, '2026-07-24T12:00:00.000Z');
    expect(Object.keys(p).sort()).toEqual(['aliasId', 'avatarId', 'banda', 'childId', 'creadoEn']);
  });

  it('no arrastra nombre real, correo, fecha de nacimiento ni ubicacion', () => {
    const p = crearPerfilInfantil(seleccion, '2026-07-24T12:00:00.000Z');
    const plano = JSON.stringify(p).toLowerCase();
    for (const prohibido of ['nombre', 'correo', 'email', 'telefono', 'nacimiento', 'foto', 'ubicacion']) {
      expect(plano).not.toContain(prohibido);
    }
  });

  it('el id no es adivinable a partir de la seleccion', () => {
    const p = crearPerfilInfantil(seleccion, '2026-07-24T12:00:00.000Z');
    expect(p.childId).not.toContain(seleccion.aliasId);
    expect(p.childId).not.toContain(seleccion.banda);
  });
});
