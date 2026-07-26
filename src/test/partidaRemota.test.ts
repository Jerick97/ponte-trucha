/**
 * El loop del juego contra el backend, con `fetch` falso.
 *
 * Lo que se prueba: que el store no invente contenido ni puntaje, que la
 * revelacion llegue recien con el intento, que la conversacion solo se ofrezca
 * con consentimiento y que un error del servidor no deje la partida colgada.
 */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { usePartida } from '../store/usePartida';
import { useSesion } from '../store/sesion';
import { reiniciarClientes } from '../api';
import { VERSION_POLITICA } from '../onboarding/consentimiento';
import type { MapaConsentimiento } from '../onboarding/consentimiento';
import type { PerfilInfantil } from '../onboarding/perfilInfantil';

const PERFIL: PerfilInfantil = {
  childId: 'child_1',
  aliasId: 'zorro-listo',
  avatarId: 'zorro',
  banda: '8-10',
  creadoEn: '2026-07-24T12:00:00Z',
};

function reto(id: string) {
  return {
    challengeId: id,
    appType: 'roblox',
    difficulty: 1,
    payload: {
      canal: 'chat-juego',
      dificultad: 1,
      remitente: { nombre: 'RobuxKing_Oficial', avatar: '👑', verificado: false },
      mensaje: 'Pon tu contraseña y te mando 10000 Robux',
    },
    validUntil: '2026-07-25T20:00:00Z',
  };
}

const RESULTADO = {
  attemptId: 'attempt_1',
  challengeId: 'challenge_1',
  isCorrect: true,
  pointsAwarded: 100,
  score: 100,
  streak: 1,
  totalAttempts: 1,
  correctAttempts: 1,
  currentDifficulty: 1,
  signalCodes: ['tu-contrasena'],
  feedbackCode: 'nadie-te-pide-tu-clave',
  correctDecision: 'trap',
  scenarioType: 'monedas-gratis',
  signals: [{ fragment: 'tu contraseña', explanation: 'Nadie de verdad te pide tu clave.' }],
  lesson: 'Nadie regala monedas a cambio de tu contraseña.',
  allowsConversation: true,
  scammerProfile: { disguise: 'un jugador famoso', tactics: ['prisa'], objective: 'la clave' },
};

let retosPedidos = 0;
/** Codigo de error que debe devolver el proximo `GET .../retos/siguiente`. */
let errorDelReto: { codigo: string; status: number } | null = null;

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function fetchFalso(url: string | URL | Request, init?: RequestInit): Promise<Response> {
  const ruta = String(url);
  const metodo = init?.method ?? 'GET';

  if (ruta.endsWith('/retos/siguiente')) {
    if (errorDelReto !== null) {
      const problema = { code: errorDelReto.codigo, title: 'x', status: errorDelReto.status };
      return Promise.resolve(json(problema, errorDelReto.status));
    }
    retosPedidos += 1;
    return Promise.resolve(json(reto(`challenge_${retosPedidos}`)));
  }
  if (ruta.includes('/intentos') && metodo === 'POST') {
    return Promise.resolve(json(RESULTADO));
  }
  if (ruta.endsWith('/conversaciones/respuestas')) {
    return Promise.resolve(json({ texto: 'Apúrate, se acaba', origen: 'curated', filtrada: true }));
  }
  return Promise.resolve(json({ code: 'NOT_FOUND', title: 'x', status: 404 }, 404));
}

function consentimiento(serverSideAi: boolean): MapaConsentimiento {
  const otorgado = {
    estado: 'otorgado' as const,
    versionPolitica: VERSION_POLITICA,
    decididoEn: '2026-07-24T12:00:00Z',
  };
  const denegado = { estado: 'denegado' as const, versionPolitica: VERSION_POLITICA };
  return {
    core: otorgado,
    serverSideAi: serverSideAi ? otorgado : denegado,
    productAnalytics: denegado,
  };
}

/** Sesion ya autenticada: lo que interesa aqui es el loop, no el onboarding. */
function sesionLista(serverSideAi = true) {
  useSesion.setState({
    paso: 'jugando',
    perfil: PERFIL,
    consentimiento: consentimiento(serverSideAi),
  });
}

beforeEach(() => {
  retosPedidos = 0;
  errorDelReto = null;
  vi.stubEnv('VITE_API_BASE_URL', '/api');
  vi.stubGlobal('fetch', vi.fn(fetchFalso));
  reiniciarClientes();
  usePartida.getState().reiniciar();
  useSesion.getState().cerrarSesion();
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  reiniciarClientes();
});

describe('inicio de la partida', () => {
  it('pide el primer reto al backend y lo muestra sin revelacion', async () => {
    sesionLista();

    await usePartida.getState().iniciar();

    const estado = usePartida.getState();
    expect(estado.fase).toBe('mensaje');
    expect(estado.escenarioActual()?.id).toBe('challenge_1');
    expect(estado.escenarioActual()?.senales).toEqual([]);
    expect(estado.escenarioActual()?.leccion).toBe('');
  });

  it('avisa sin dejar la partida colgada si el servidor falla', async () => {
    sesionLista();
    errorDelReto = { codigo: 'CONSENT_REQUIRED', status: 403 };

    await usePartida.getState().iniciar();

    expect(usePartida.getState().fase).toBe('inicio');
    expect(usePartida.getState().estadoReto).toBe('error');
    expect(usePartida.getState().errorJuego).toContain('permiso');
  });

  it('no intenta jugar sin perfil infantil', async () => {
    await usePartida.getState().iniciar();

    expect(usePartida.getState().errorJuego).toContain('.env.local');
    expect(retosPedidos).toBe(0);
  });
});

describe('intento', () => {
  it('usa el puntaje del servidor y completa la revelacion', async () => {
    sesionLista();
    await usePartida.getState().iniciar();

    await usePartida.getState().responderEscenario('trampa');

    const estado = usePartida.getState();
    expect(estado.fase).toBe('feedback');
    expect(estado.partida.puntaje).toBe(100);
    expect(estado.partida.racha).toBe(1);
    expect(estado.partida.aciertos).toBe(1);
    expect(estado.escenarioActual()?.senales[0].fragmento).toBe('tu contraseña');
    expect(estado.escenarioActual()?.leccion).toContain('contraseña');
  });

  it('no ofrece conversacion si el adulto no la autorizo', async () => {
    sesionLista(false);
    await usePartida.getState().iniciar();

    await usePartida.getState().responderEscenario('trampa');

    expect(usePartida.getState().escenarioActual()?.permiteConversacion).toBe(false);
  });

  it('ofrece conversacion cuando hay consentimiento y el escenario la admite', async () => {
    sesionLista();
    await usePartida.getState().iniciar();

    await usePartida.getState().responderEscenario('trampa');

    expect(usePartida.getState().escenarioActual()?.permiteConversacion).toBe(true);
  });
});

describe('avance de la partida', () => {
  it('pide un reto nuevo por ronda y termina al completar el total', async () => {
    sesionLista();
    await usePartida.getState().iniciar();

    for (let ronda = 0; ronda < usePartida.getState().totalRondas; ronda += 1) {
      await usePartida.getState().responderEscenario('trampa');
      await usePartida.getState().siguiente();
    }

    expect(usePartida.getState().fase).toBe('resultado');
    expect(retosPedidos).toBe(usePartida.getState().totalRondas);
  });

  it('cierra la partida si el banco se queda sin escenarios elegibles', async () => {
    sesionLista();
    await usePartida.getState().iniciar();
    await usePartida.getState().responderEscenario('trampa');
    errorDelReto = { codigo: 'NO_ELIGIBLE_SCENARIO', status: 409 };

    await usePartida.getState().siguiente();

    expect(usePartida.getState().fase).toBe('resultado');
  });
});

describe('conversacion con el estafador', () => {
  it('manda el historial y agrega la respuesta curada', async () => {
    sesionLista();
    await usePartida.getState().iniciar();
    await usePartida.getState().responderEscenario('trampa');
    usePartida.getState().abrirChat();

    await usePartida.getState().enviarMensajeAlEstafador('no te doy mi clave');

    const chat = usePartida.getState().chat;
    expect(chat.map((t) => t.autor)).toEqual(['nino', 'estafador']);
    expect(chat[1].texto).toBe('Apúrate, se acaba');
    expect(usePartida.getState().chatCargando).toBe(false);
  });
});
