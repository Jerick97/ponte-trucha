/**
 * Pruebas del onboarding adulto contra un `fetch` falso.
 *
 * No se mockea el store ni los clientes: se responde a nivel de red, asi que
 * cada caso ejercita de verdad el cliente de Cognito, el cliente del API y las
 * puertas del flujo. Lo que importa aqui son esas puertas y la privacidad de la
 * sesion, no el HTML.
 */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useSesion } from '../store/sesion';
import { reiniciarClientes, tokenVigente } from '../api';
import { ALIAS_CATALOGO, AVATARES_CATALOGO } from '../onboarding/perfilInfantil';
import { VERSION_POLITICA } from '../onboarding/consentimiento';
import { VERSION_REGLA_AGE_GATE } from '../onboarding/ageGate';

const SELECCION = {
  aliasId: ALIAS_CATALOGO[0].id,
  avatarId: AVATARES_CATALOGO[0].id,
  banda: '8-10' as const,
};

const PRUEBA_GATE = {
  versionRegla: VERSION_REGLA_AGE_GATE,
  aprobadoEn: '2026-07-24T12:00:00.000Z',
};

const CORREO = 'adulto@ejemplo.com';
const CLAVE = 'Trucha-Local-2026!';

interface Peticion {
  url: string;
  target: string | undefined;
  cuerpo: unknown;
}

let peticiones: Peticion[] = [];
/** Consentimientos que el "servidor" tiene guardados. */
let consentimientosGuardados: Record<string, string> = {};
/** Perfiles infantiles que el "servidor" tiene guardados. */
let perfilesGuardados: Record<string, unknown>[] = [];
/** Fuerza el error de una accion de Cognito, por nombre de `X-Amz-Target`. */
let fallaCognito: { accion: string; tipo: string } | null = null;

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Backend de mentira a nivel HTTP: Cognito en `/cognito` y el API en `/api`. */
function fetchFalso(url: string | URL | Request, init?: RequestInit): Promise<Response> {
  const ruta = String(url);
  const headers = (init?.headers ?? {}) as Record<string, string>;
  const target = headers['X-Amz-Target']?.split('.').pop();
  const cuerpo: unknown = init?.body === undefined ? null : JSON.parse(String(init.body));
  peticiones.push({ url: ruta, target, cuerpo });

  if (ruta.startsWith('/cognito')) {
    const falla = fallaCognito;
    if (falla !== null && falla.accion === target) {
      return Promise.resolve(json({ __type: falla.tipo, message: 'no' }, 400));
    }
    if (target === 'SignUp') return Promise.resolve(json({ UserConfirmed: true }));
    if (target === 'ConfirmSignUp') return Promise.resolve(json({}));
    if (target === 'GetUser') {
      return Promise.resolve(
        json({ Username: CORREO, UserAttributes: [{ Name: 'email', Value: CORREO }] }),
      );
    }
    if (target === 'InitiateAuth') {
      const flujo = (cuerpo as { AuthFlow: string }).AuthFlow;
      // Cognito no reemite refresh token al renovar; solo al iniciar sesion.
      return Promise.resolve(
        json({
          AuthenticationResult: {
            AccessToken: 'token-cognito',
            ExpiresIn: 3600,
            ...(flujo === 'REFRESH_TOKEN_AUTH' ? {} : { RefreshToken: 'refresh-cognito' }),
          },
        }),
      );
    }
    return Promise.resolve(json({}));
  }

  const metodo = init?.method ?? 'GET';
  const cuenta = {
    status: 'active',
    ageGateRuleVersion: VERSION_REGLA_AGE_GATE,
    profileCount: perfilesGuardados.length,
    createdAt: '2026-07-24T12:00:00Z',
    updatedAt: '2026-07-24T12:00:00Z',
  };
  if (ruta === '/api/v1/cuenta' && metodo === 'POST') return Promise.resolve(json(cuenta));
  if (ruta === '/api/v1/me' && metodo === 'GET') return Promise.resolve(json(cuenta));
  if (ruta.startsWith('/api/v1/consentimientos') && metodo === 'PATCH') {
    const finalidad = ruta.split('/').pop() ?? '';
    const decision = (cuerpo as { decision: string }).decision;
    consentimientosGuardados[finalidad] = decision === 'grant' ? 'granted' : 'denied';
    return Promise.resolve(json({}));
  }
  if (ruta === '/api/v1/consentimientos' && metodo === 'GET') {
    return Promise.resolve(
      json(
        Object.entries(consentimientosGuardados).map(([purpose, state]) => ({
          purpose,
          state,
          policyVersion: VERSION_POLITICA,
          decidedAt: '2026-07-24T12:00:00Z',
          revokedAt: null,
        })),
      ),
    );
  }
  if (ruta === '/api/v1/perfiles' && metodo === 'GET') {
    return Promise.resolve(json(perfilesGuardados));
  }
  if (ruta === '/api/v1/perfiles' && metodo === 'POST') {
    const entrada = cuerpo as { aliasId: string; avatarId: string; ageBand: string };
    const perfil = {
      childId: `child_del_servidor_${perfilesGuardados.length + 1}`,
      aliasId: entrada.aliasId,
      avatarId: entrada.avatarId,
      ageBand: entrada.ageBand,
      createdAt: '2026-07-24T12:00:00Z',
      updatedAt: '2026-07-24T12:00:00Z',
    };
    perfilesGuardados.push(perfil);
    return Promise.resolve(json(perfil, 201));
  }
  return Promise.resolve(json({ code: 'NOT_FOUND', title: 'No existe', status: 404 }, 404));
}

/** Recorre el flujo completo hasta dejar la sesion lista para jugar. */
async function completarOnboarding() {
  const s = useSesion.getState();
  s.irAAgeGate();
  s.aprobarAgeGate(PRUEBA_GATE);
  await useSesion.getState().acceder(CORREO, CLAVE);
  useSesion.getState().decidirFinalidad('core', true);
  await useSesion.getState().confirmarConsentimiento();
  await useSesion.getState().crearPerfil(SELECCION);
  useSesion.getState().empezarAJugar();
}

beforeEach(() => {
  peticiones = [];
  consentimientosGuardados = {};
  perfilesGuardados = [];
  fallaCognito = null;
  vi.stubEnv('VITE_API_BASE_URL', '/api');
  vi.stubEnv('VITE_COGNITO_URL', '/cognito');
  vi.stubEnv('VITE_COGNITO_CLIENT_ID', 'client-de-prueba');
  vi.stubGlobal('fetch', vi.fn(fetchFalso));
  reiniciarClientes();
  // El almacenamiento se limpia antes de cerrar sesion: asi ningun test hereda
  // el refresh token del anterior ni su peticion de revocacion.
  localStorage.clear();
  sessionStorage.clear();
  useSesion.getState().cerrarSesion();
  peticiones = [];
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  reiniciarClientes();
});

describe('flujo del onboarding', () => {
  it('arranca en la landing', () => {
    expect(useSesion.getState().paso).toBe('landing');
  });

  it('recorre landing -> ageGate -> acceso -> consentimiento -> perfil -> jugando', async () => {
    const s = useSesion.getState();
    s.irAAgeGate();
    expect(useSesion.getState().paso).toBe('ageGate');

    s.aprobarAgeGate(PRUEBA_GATE);
    expect(useSesion.getState().paso).toBe('acceso');

    await useSesion.getState().acceder(CORREO, CLAVE);
    expect(useSesion.getState().paso).toBe('consentimiento');
    expect(useSesion.getState().adulto?.correo).toBe(CORREO);

    useSesion.getState().decidirFinalidad('core', true);
    await useSesion.getState().confirmarConsentimiento();
    expect(useSesion.getState().paso).toBe('perfil');

    await useSesion.getState().crearPerfil(SELECCION);
    useSesion.getState().empezarAJugar();
    expect(useSesion.getState().paso).toBe('jugando');
  });

  it('el childId lo decide el servidor, no el navegador', async () => {
    await completarOnboarding();

    expect(useSesion.getState().perfil?.childId).toBe('child_del_servidor_1');
  });

  it('registra la cuenta en Cognito y la provisiona en el API', async () => {
    const s = useSesion.getState();
    s.irAAgeGate();
    s.aprobarAgeGate(PRUEBA_GATE);
    await useSesion.getState().registrar(CORREO, CLAVE);

    expect(peticiones.map((p) => p.target)).toContain('SignUp');
    expect(peticiones.map((p) => p.target)).toContain('InitiateAuth');
    expect(peticiones.some((p) => p.url === '/api/v1/cuenta')).toBe(true);
    expect(useSesion.getState().paso).toBe('consentimiento');
  });

  it('pide el codigo cuando Cognito exige confirmar el correo', async () => {
    fallaCognito = { accion: 'InitiateAuth', tipo: 'UserNotConfirmedException' };
    const s = useSesion.getState();
    s.irAAgeGate();
    s.aprobarAgeGate(PRUEBA_GATE);

    await useSesion.getState().acceder(CORREO, CLAVE);

    expect(useSesion.getState().paso).toBe('confirmacion');
    expect(useSesion.getState().correoPorConfirmar).toBe(CORREO);
    expect(tokenVigente()).toBeNull();
  });

  it('permite volver atras sin perder el paso anterior', () => {
    const s = useSesion.getState();
    s.irAAgeGate();
    s.volver();
    expect(useSesion.getState().paso).toBe('landing');
  });
});

describe('puertas del flujo', () => {
  it('no autentica si el age gate no fue aprobado', async () => {
    await useSesion.getState().acceder(CORREO, CLAVE);

    expect(useSesion.getState().paso).toBe('landing');
    expect(useSesion.getState().adulto).toBeNull();
    expect(peticiones).toHaveLength(0);
  });

  // R3: sin consentimiento core vigente no se crean perfiles.
  it('no confirma el consentimiento si "core" quedo denegado', async () => {
    const s = useSesion.getState();
    s.irAAgeGate();
    s.aprobarAgeGate(PRUEBA_GATE);
    await useSesion.getState().acceder(CORREO, CLAVE);

    await useSesion.getState().confirmarConsentimiento();

    expect(useSesion.getState().paso).toBe('consentimiento');
    expect(consentimientosGuardados).toEqual({});
  });

  it('no crea perfil sin consentimiento core', async () => {
    const s = useSesion.getState();
    s.irAAgeGate();
    s.aprobarAgeGate(PRUEBA_GATE);
    await useSesion.getState().acceder(CORREO, CLAVE);

    await useSesion.getState().crearPerfil(SELECCION);

    expect(useSesion.getState().perfil).toBeNull();
  });

  it('no llega a jugar sin perfil creado', async () => {
    const s = useSesion.getState();
    s.irAAgeGate();
    s.aprobarAgeGate(PRUEBA_GATE);
    await useSesion.getState().acceder(CORREO, CLAVE);
    useSesion.getState().decidirFinalidad('core', true);
    await useSesion.getState().confirmarConsentimiento();

    useSesion.getState().empezarAJugar();

    expect(useSesion.getState().paso).toBe('perfil');
  });

  it('las finalidades opcionales arrancan apagadas', async () => {
    const s = useSesion.getState();
    s.irAAgeGate();
    s.aprobarAgeGate(PRUEBA_GATE);
    await useSesion.getState().acceder(CORREO, CLAVE);

    const c = useSesion.getState().consentimiento;
    expect(c.serverSideAi.estado).toBe('denegado');
    expect(c.productAnalytics.estado).toBe('denegado');
  });

  it('manda una decision por finalidad, nunca un "acepto todo"', async () => {
    await completarOnboarding();

    expect(consentimientosGuardados).toEqual({
      core: 'granted',
      serverSideAi: 'denied',
      productAnalytics: 'denied',
    });
  });
});

describe('privacidad de la sesion', () => {
  // estandares-de-codigo.md: nada de esto va a localStorage.
  it('no escribe correo, consentimiento, age gate ni token en localStorage', async () => {
    await completarOnboarding();
    const volcado = JSON.stringify(localStorage).toLowerCase();
    expect(volcado).not.toContain('adulto@ejemplo.com');
    expect(volcado).not.toContain('consent');
    expect(volcado).not.toContain('agegate');
    expect(volcado).not.toContain('token');
  });

  it('no guarda la contrasena ni el token en el estado del store', async () => {
    await completarOnboarding();
    const estado = JSON.stringify(useSesion.getState());
    expect(estado).not.toContain(CLAVE);
    expect(estado).not.toContain('token-cognito');
  });

  it('el token viaja en Authorization, nunca en la URL', async () => {
    await completarOnboarding();
    const alApi = peticiones.filter((p) => p.url.startsWith('/api'));
    expect(alApi.length).toBeGreaterThan(0);
    expect(alApi.every((p) => !p.url.includes('token-cognito'))).toBe(true);
  });

  it('no guarda la fecha de nacimiento en ninguna parte del estado', async () => {
    await completarOnboarding();
    const estado = JSON.stringify(useSesion.getState());
    expect(estado.toLowerCase()).not.toContain('nacimiento');
    expect(estado).not.toMatch(/"dia"|"mes"|"anio"/);
  });

  it('del age gate solo conserva version de regla y timestamp', async () => {
    await completarOnboarding();
    const prueba = useSesion.getState().pruebaAgeGate;
    expect(prueba && Object.keys(prueba).sort()).toEqual(['aprobadoEn', 'versionRegla']);
  });
});

describe('cerrarSesion', () => {
  it('borra adulto, perfil, consentimiento, prueba del gate y token', async () => {
    await completarOnboarding();
    useSesion.getState().cerrarSesion();
    const s = useSesion.getState();
    expect(s.paso).toBe('landing');
    expect(s.adulto).toBeNull();
    expect(s.perfil).toBeNull();
    expect(s.pruebaAgeGate).toBeNull();
    expect(s.consentimiento.core.estado).toBe('denegado');
    expect(tokenVigente()).toBeNull();
  });
});

describe('estado del acceso', () => {
  it('arranca en idle y termina en success', async () => {
    expect(useSesion.getState().estadoAcceso).toBe('idle');
    await completarOnboarding();
    expect(useSesion.getState().estadoAcceso).toBe('success');
  });

  it('deja el error de Cognito visible y sin adulto autenticado', async () => {
    fallaCognito = { accion: 'InitiateAuth', tipo: 'NotAuthorizedException' };
    const s = useSesion.getState();
    s.irAAgeGate();
    s.aprobarAgeGate(PRUEBA_GATE);

    await useSesion.getState().acceder(CORREO, CLAVE);

    expect(useSesion.getState().estadoAcceso).toBe('error');
    expect(useSesion.getState().errorAcceso).toContain('incorrectos');
    expect(useSesion.getState().adulto).toBeNull();
    expect(useSesion.getState().paso).toBe('acceso');
    expect(tokenVigente()).toBeNull();
  });

  it('avisa cuando falta configurar el backend', async () => {
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', '');
    reiniciarClientes();
    const s = useSesion.getState();
    s.irAAgeGate();
    s.aprobarAgeGate(PRUEBA_GATE);

    await useSesion.getState().acceder(CORREO, CLAVE);

    expect(useSesion.getState().estadoAcceso).toBe('error');
    expect(useSesion.getState().errorAcceso).toContain('.env.local');
  });
});

describe('perfiles existentes', () => {
  it('al volver a entrar ofrece elegir perfil en vez de crear otro', async () => {
    await completarOnboarding();
    expect(perfilesGuardados).toHaveLength(1);

    useSesion.getState().cerrarSesion();
    const s = useSesion.getState();
    s.irAAgeGate();
    s.aprobarAgeGate(PRUEBA_GATE);
    await useSesion.getState().acceder(CORREO, CLAVE);

    expect(useSesion.getState().paso).toBe('perfiles');
    expect(useSesion.getState().perfiles.map((p) => p.childId)).toEqual([
      'child_del_servidor_1',
    ]);
  });

  it('elegir un perfil existente conserva su childId y deja jugar', async () => {
    await completarOnboarding();
    useSesion.getState().cerrarSesion();
    const s = useSesion.getState();
    s.irAAgeGate();
    s.aprobarAgeGate(PRUEBA_GATE);
    await useSesion.getState().acceder(CORREO, CLAVE);

    useSesion.getState().elegirPerfil('child_del_servidor_1');
    useSesion.getState().empezarAJugar();

    expect(useSesion.getState().perfil?.childId).toBe('child_del_servidor_1');
    expect(useSesion.getState().paso).toBe('jugando');
    // No se creo un perfil nuevo: el progreso anterior sigue alcanzable.
    expect(perfilesGuardados).toHaveLength(1);
  });

  it('no crea perfiles nuevos por elegir uno inexistente', async () => {
    await completarOnboarding();

    useSesion.getState().elegirPerfil('child_de_otro');

    expect(useSesion.getState().perfil?.childId).toBe('child_del_servidor_1');
  });
});

describe('sesion persistente', () => {
  /** Simula una recarga: el store vuelve a cero, el navegador conserva la pestaña. */
  function recargar() {
    useSesion.setState({
      paso: 'landing',
      adulto: null,
      perfil: null,
      perfiles: [],
      pruebaAgeGate: null,
      estadoAcceso: 'idle',
    });
    reiniciarClientes();
  }

  it('reanuda la sesion tras recargar, sin volver a la landing', async () => {
    await completarOnboarding();
    recargar();

    await useSesion.getState().restaurar();

    const estado = useSesion.getState();
    expect(estado.paso).toBe('perfiles');
    expect(estado.adulto?.correo).toBe(CORREO);
    expect(estado.perfiles).toHaveLength(1);
    expect(estado.restaurando).toBe(false);
    expect(tokenVigente()).toBe('token-cognito');
  });

  it('conserva la prueba del age gate que guarda el servidor', async () => {
    await completarOnboarding();
    recargar();

    await useSesion.getState().restaurar();

    expect(useSesion.getState().pruebaAgeGate?.versionRegla).toBe(VERSION_REGLA_AGE_GATE);
  });

  it('sin sesion guardada no llama a nadie y se queda en la landing', async () => {
    await useSesion.getState().restaurar();

    expect(useSesion.getState().paso).toBe('landing');
    expect(peticiones).toHaveLength(0);
  });

  it('olvida la sesion si el refresh token ya no sirve', async () => {
    await completarOnboarding();
    recargar();
    fallaCognito = { accion: 'InitiateAuth', tipo: 'NotAuthorizedException' };

    await useSesion.getState().restaurar();

    expect(useSesion.getState().paso).toBe('landing');
    expect(useSesion.getState().adulto).toBeNull();
    expect(tokenVigente()).toBeNull();
    expect(sessionStorage.getItem('ptk.sesion.refresh')).toBeNull();
  });

  it('guarda el refresh token en sessionStorage y nunca en localStorage', async () => {
    await completarOnboarding();

    expect(sessionStorage.getItem('ptk.sesion.refresh')).toBe('refresh-cognito');
    expect(JSON.stringify(localStorage)).not.toContain('refresh-cognito');
  });

  it('cerrar sesion revoca el refresh token y lo borra del navegador', async () => {
    await completarOnboarding();

    useSesion.getState().cerrarSesion();

    expect(sessionStorage.getItem('ptk.sesion.refresh')).toBeNull();
    expect(peticiones.some((p) => p.target === 'RevokeToken')).toBe(true);
  });

  it('el access token nunca se persiste', async () => {
    await completarOnboarding();

    expect(JSON.stringify(sessionStorage)).not.toContain('token-cognito');
    expect(JSON.stringify(localStorage)).not.toContain('token-cognito');
  });
});
