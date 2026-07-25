import { describe, it, expect, beforeEach } from 'vitest';
import { useSesion } from '../store/sesion';
import { ALIAS_CATALOGO, AVATARES_CATALOGO } from '../onboarding/perfilInfantil';
import { VERSION_REGLA_AGE_GATE } from '../onboarding/ageGate';

const SELECCION = {
  aliasId: ALIAS_CATALOGO[0].id,
  avatarId: AVATARES_CATALOGO[0].id,
  banda: '8-10' as const,
};

/** Recorre el flujo completo hasta dejar la sesion lista para jugar. */
function completarOnboarding() {
  const s = useSesion.getState();
  s.irAAgeGate();
  s.aprobarAgeGate({ versionRegla: VERSION_REGLA_AGE_GATE, aprobadoEn: '2026-07-24T12:00:00.000Z' });
  s.autenticar('adulto@ejemplo.com');
  s.decidirFinalidad('core', true);
  s.confirmarConsentimiento();
  s.crearPerfil(SELECCION);
  s.empezarAJugar();
}

beforeEach(() => {
  useSesion.getState().cerrarSesion();
  localStorage.clear();
});

describe('flujo del onboarding', () => {
  it('arranca en la landing', () => {
    expect(useSesion.getState().paso).toBe('landing');
  });

  it('recorre landing -> ageGate -> acceso -> consentimiento -> perfil -> jugando', () => {
    const s = useSesion.getState();
    s.irAAgeGate();
    expect(useSesion.getState().paso).toBe('ageGate');

    s.aprobarAgeGate({ versionRegla: VERSION_REGLA_AGE_GATE, aprobadoEn: '2026-07-24T12:00:00.000Z' });
    expect(useSesion.getState().paso).toBe('acceso');

    s.autenticar('adulto@ejemplo.com');
    expect(useSesion.getState().paso).toBe('consentimiento');

    s.decidirFinalidad('core', true);
    s.confirmarConsentimiento();
    expect(useSesion.getState().paso).toBe('perfil');

    s.crearPerfil(SELECCION);
    s.empezarAJugar();
    expect(useSesion.getState().paso).toBe('jugando');
  });

  it('permite volver atras sin perder el paso anterior', () => {
    const s = useSesion.getState();
    s.irAAgeGate();
    s.volver();
    expect(useSesion.getState().paso).toBe('landing');
  });
});

describe('puertas del flujo', () => {
  it('no autentica si el age gate no fue aprobado', () => {
    useSesion.getState().autenticar('adulto@ejemplo.com');
    expect(useSesion.getState().paso).toBe('landing');
    expect(useSesion.getState().adulto).toBeNull();
  });

  // R3: sin consentimiento core vigente no se crean perfiles.
  it('no confirma el consentimiento si "core" quedo denegado', () => {
    const s = useSesion.getState();
    s.irAAgeGate();
    s.aprobarAgeGate({ versionRegla: VERSION_REGLA_AGE_GATE, aprobadoEn: '2026-07-24T12:00:00.000Z' });
    s.autenticar('adulto@ejemplo.com');
    s.confirmarConsentimiento();
    expect(useSesion.getState().paso).toBe('consentimiento');
  });

  it('no crea perfil sin consentimiento core', () => {
    const s = useSesion.getState();
    s.irAAgeGate();
    s.aprobarAgeGate({ versionRegla: VERSION_REGLA_AGE_GATE, aprobadoEn: '2026-07-24T12:00:00.000Z' });
    s.autenticar('adulto@ejemplo.com');
    s.crearPerfil(SELECCION);
    expect(useSesion.getState().perfil).toBeNull();
  });

  it('no llega a jugar sin perfil creado', () => {
    const s = useSesion.getState();
    s.irAAgeGate();
    s.aprobarAgeGate({ versionRegla: VERSION_REGLA_AGE_GATE, aprobadoEn: '2026-07-24T12:00:00.000Z' });
    s.autenticar('adulto@ejemplo.com');
    s.decidirFinalidad('core', true);
    s.confirmarConsentimiento();
    s.empezarAJugar();
    expect(useSesion.getState().paso).toBe('perfil');
  });

  it('las finalidades opcionales arrancan apagadas', () => {
    const s = useSesion.getState();
    s.irAAgeGate();
    s.aprobarAgeGate({ versionRegla: VERSION_REGLA_AGE_GATE, aprobadoEn: '2026-07-24T12:00:00.000Z' });
    s.autenticar('adulto@ejemplo.com');
    const c = useSesion.getState().consentimiento;
    expect(c.serverSideAi.estado).toBe('denegado');
    expect(c.productAnalytics.estado).toBe('denegado');
  });
});

describe('privacidad de la sesion', () => {
  // estandares-de-codigo.md: nada de esto va a localStorage.
  it('no escribe correo, consentimiento ni age gate en localStorage', () => {
    completarOnboarding();
    const volcado = JSON.stringify(localStorage).toLowerCase();
    expect(volcado).not.toContain('adulto@ejemplo.com');
    expect(volcado).not.toContain('consent');
    expect(volcado).not.toContain('agegate');
    expect(volcado).not.toContain('token');
  });

  it('no guarda la fecha de nacimiento en ninguna parte del estado', () => {
    completarOnboarding();
    const estado = JSON.stringify(useSesion.getState());
    expect(estado.toLowerCase()).not.toContain('nacimiento');
    expect(estado).not.toMatch(/"dia"|"mes"|"anio"/);
  });

  it('del age gate solo conserva version de regla y timestamp', () => {
    completarOnboarding();
    const prueba = useSesion.getState().pruebaAgeGate;
    expect(prueba && Object.keys(prueba).sort()).toEqual(['aprobadoEn', 'versionRegla']);
  });
});

describe('cerrarSesion', () => {
  it('borra adulto, perfil, consentimiento y prueba del gate', () => {
    completarOnboarding();
    useSesion.getState().cerrarSesion();
    const s = useSesion.getState();
    expect(s.paso).toBe('landing');
    expect(s.adulto).toBeNull();
    expect(s.perfil).toBeNull();
    expect(s.pruebaAgeGate).toBeNull();
    expect(s.consentimiento.core.estado).toBe('denegado');
  });
});

describe('estado del acceso', () => {
  it('arranca en idle y termina en success', () => {
    expect(useSesion.getState().estadoAcceso).toBe('idle');
    completarOnboarding();
    expect(useSesion.getState().estadoAcceso).toBe('success');
  });

  it('registra un error de acceso sin dejar al adulto autenticado', () => {
    const s = useSesion.getState();
    s.irAAgeGate();
    s.aprobarAgeGate({ versionRegla: VERSION_REGLA_AGE_GATE, aprobadoEn: '2026-07-24T12:00:00.000Z' });
    s.fallarAcceso('No pudimos verificar el correo.');
    expect(useSesion.getState().estadoAcceso).toBe('error');
    expect(useSesion.getState().adulto).toBeNull();
    expect(useSesion.getState().paso).toBe('acceso');
  });
});
