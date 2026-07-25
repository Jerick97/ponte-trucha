import { describe, it, expect } from 'vitest';
import {
  FINALIDADES,
  VERSION_POLITICA,
  consentimientoInicial,
  decidir,
  revocar,
  puedeUsar,
  faltaDecisionVigente,
  esOpcional,
} from '../onboarding/consentimiento';

const AHORA = '2026-07-24T12:00:00.000Z';

describe('consentimientoInicial', () => {
  // seguridad-infantil.md: negar por defecto, sin patrones oscuros.
  it('arranca todas las finalidades opcionales en denegado', () => {
    const c = consentimientoInicial();
    for (const f of FINALIDADES) {
      if (esOpcional(f.clave)) expect(c[f.clave].estado).toBe('denegado');
    }
  });

  it('arranca tambien "core" en denegado: nadie consiente por el adulto', () => {
    expect(consentimientoInicial().core.estado).toBe('denegado');
  });

  it('declara core como necesario y las otras dos como opcionales', () => {
    expect(esOpcional('core')).toBe(false);
    expect(esOpcional('serverSideAi')).toBe(true);
    expect(esOpcional('productAnalytics')).toBe(true);
  });
});

describe('decidir', () => {
  it('registra estado, version y timestamp de la decision', () => {
    const c = decidir(consentimientoInicial(), 'core', true, AHORA);
    expect(c.core.estado).toBe('otorgado');
    expect(c.core.versionPolitica).toBe(VERSION_POLITICA);
    expect(c.core.decididoEn).toBe(AHORA);
  });

  it('no toca las demas finalidades al decidir una', () => {
    const c = decidir(consentimientoInicial(), 'serverSideAi', true, AHORA);
    expect(c.core.estado).toBe('denegado');
    expect(c.productAnalytics.estado).toBe('denegado');
  });

  it('permite negar explicitamente', () => {
    const c = decidir(consentimientoInicial(), 'productAnalytics', false, AHORA);
    expect(c.productAnalytics.estado).toBe('denegado');
    expect(c.productAnalytics.decididoEn).toBe(AHORA);
  });
});

describe('puedeUsar', () => {
  it('deja usar una finalidad otorgada en la version vigente', () => {
    const c = decidir(consentimientoInicial(), 'serverSideAi', true, AHORA);
    expect(puedeUsar(c, 'serverSideAi')).toBe(true);
  });

  it('no deja usar una finalidad nunca decidida', () => {
    expect(puedeUsar(consentimientoInicial(), 'serverSideAi')).toBe(false);
  });

  // design.md: un cambio de version invalida el permiso hasta nueva decision.
  it('no deja usar una finalidad otorgada en una version anterior', () => {
    const c = decidir(consentimientoInicial(), 'serverSideAi', true, AHORA);
    const viejo = {
      ...c,
      serverSideAi: { ...c.serverSideAi, versionPolitica: 'v0-antigua' },
    };
    expect(puedeUsar(viejo, 'serverSideAi')).toBe(false);
    expect(faltaDecisionVigente(viejo, 'serverSideAi')).toBe(true);
  });
});

describe('revocar', () => {
  it('marca la finalidad como revocada y guarda cuando', () => {
    const otorgado = decidir(consentimientoInicial(), 'productAnalytics', true, AHORA);
    const c = revocar(otorgado, 'productAnalytics', '2026-07-25T00:00:00.000Z');
    expect(c.productAnalytics.estado).toBe('revocado');
    expect(c.productAnalytics.revocadoEn).toBe('2026-07-25T00:00:00.000Z');
  });

  it('deja de permitir el uso despues de revocar', () => {
    const otorgado = decidir(consentimientoInicial(), 'productAnalytics', true, AHORA);
    const c = revocar(otorgado, 'productAnalytics', AHORA);
    expect(puedeUsar(c, 'productAnalytics')).toBe(false);
  });

  it('permite volver a otorgar despues de una revocacion', () => {
    const otorgado = decidir(consentimientoInicial(), 'serverSideAi', true, AHORA);
    const revocado = revocar(otorgado, 'serverSideAi', AHORA);
    const denuevo = decidir(revocado, 'serverSideAi', true, '2026-07-26T00:00:00.000Z');
    expect(puedeUsar(denuevo, 'serverSideAi')).toBe(true);
    expect(denuevo.serverSideAi.revocadoEn).toBeUndefined();
  });
});

describe('catalogo de finalidades', () => {
  it('describe las tres finalidades del diseno', () => {
    expect(FINALIDADES.map((f) => f.clave)).toEqual(['core', 'serverSideAi', 'productAnalytics']);
  });

  it('cada finalidad explica que dato, para que y como retirarlo', () => {
    for (const f of FINALIDADES) {
      expect(f.titulo.length).toBeGreaterThan(0);
      expect(f.queSeUsa.length).toBeGreaterThan(0);
      expect(f.paraQue.length).toBeGreaterThan(0);
      expect(f.comoRetirar.length).toBeGreaterThan(0);
    }
  });
});
