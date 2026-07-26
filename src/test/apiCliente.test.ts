/**
 * Pruebas del cliente del API sin red: se inyecta un `fetch` falso que registra
 * lo que se envio. Interesa el contrato del borde (headers, rutas, errores), no
 * la implementacion de zustand ni la UI.
 */

import { describe, expect, it } from 'vitest';
import { ClienteApi, ErrorApi, bucketDeTiempo, nuevaClaveIdempotencia } from '../api/cliente';

interface Llamada {
  url: string;
  init: RequestInit;
}

function fetchFalso(
  respuestas: { status: number; cuerpo?: unknown; tipo?: string }[],
): { fetchImpl: typeof fetch; llamadas: Llamada[] } {
  const llamadas: Llamada[] = [];
  let indice = 0;
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    llamadas.push({ url: String(url), init: init ?? {} });
    const respuesta = respuestas[Math.min(indice, respuestas.length - 1)];
    indice += 1;
    // Un 204 no puede llevar cuerpo: `new Response('')` lanzaria TypeError.
    return new Response(respuesta.cuerpo === undefined ? null : JSON.stringify(respuesta.cuerpo), {
      status: respuesta.status,
      headers: { 'Content-Type': respuesta.tipo ?? 'application/json' },
    });
  }) as unknown as typeof fetch;
  return { fetchImpl, llamadas };
}

function cabecera(llamada: Llamada, nombre: string): string | undefined {
  const headers = (llamada.init.headers ?? {}) as Record<string, string>;
  return headers[nombre];
}

function cliente(respuestas: { status: number; cuerpo?: unknown }[], token: string | null = 'tk') {
  const { fetchImpl, llamadas } = fetchFalso(respuestas);
  const api = new ClienteApi({
    baseUrl: 'http://api.local/',
    obtenerToken: () => token,
    fetchImpl,
  });
  return { api, llamadas };
}

describe('bucketDeTiempo', () => {
  it('agrupa los milisegundos en los rangos del backend', () => {
    expect(bucketDeTiempo(2_500)).toBe('under-10s');
    expect(bucketDeTiempo(10_000)).toBe('10-30s');
    expect(bucketDeTiempo(30_000)).toBe('10-30s');
    expect(bucketDeTiempo(45_000)).toBe('over-30s');
  });

  it('devuelve unknown si el dato no sirve', () => {
    expect(bucketDeTiempo(Number.NaN)).toBe('unknown');
    expect(bucketDeTiempo(-1)).toBe('unknown');
  });
});

describe('nuevaClaveIdempotencia', () => {
  it('genera claves distintas de al menos 8 caracteres', () => {
    const primera = nuevaClaveIdempotencia();
    const segunda = nuevaClaveIdempotencia();

    expect(primera).not.toBe(segunda);
    expect(primera.length).toBeGreaterThanOrEqual(8);
  });
});

describe('ClienteApi', () => {
  it('manda el token como Bearer y no lo pone en la URL', async () => {
    const { api, llamadas } = cliente([{ status: 200, cuerpo: { score: 0 } }]);

    await api.obtenerProgreso('child-1');

    expect(llamadas[0].url).toBe('http://api.local/v1/perfiles/child-1/progreso');
    expect(cabecera(llamadas[0], 'Authorization')).toBe('Bearer tk');
    expect(llamadas[0].url).not.toContain('tk');
  });

  it('agrega Idempotency-Key solo en las mutaciones que la exigen', async () => {
    const { api, llamadas } = cliente([
      { status: 200, cuerpo: {} },
      { status: 200, cuerpo: {} },
    ]);

    await api.enviarIntento({ challengeId: 'ch-1', decision: 'trap', bucket: 'under-10s' });
    await api.siguienteReto('child-1');

    expect(cabecera(llamadas[0], 'Idempotency-Key')).toBeTruthy();
    expect(cabecera(llamadas[1], 'Idempotency-Key')).toBeUndefined();
  });

  it('no manda Authorization cuando no hay sesion', async () => {
    const { api, llamadas } = cliente([{ status: 200, cuerpo: [] }], null);

    await api.listarApps();

    expect(cabecera(llamadas[0], 'Authorization')).toBeUndefined();
  });

  it('traduce problem+json al codigo estable del backend', async () => {
    const { api } = cliente([
      {
        status: 403,
        cuerpo: {
          type: 'https://ponte-trucha.pe/problems/consent-required',
          title: 'Falta consentimiento vigente',
          status: 403,
          detail: 'Falta consentimiento vigente',
          code: 'CONSENT_REQUIRED',
        },
      },
    ]);

    await expect(api.siguienteReto('child-1')).rejects.toMatchObject({
      codigo: 'CONSENT_REQUIRED',
      status: 403,
    });
  });

  it('marca como transitorios los errores de red y de servidor', () => {
    expect(new ErrorApi('NETWORK_ERROR', 0, 'x').esTransitorio).toBe(true);
    expect(new ErrorApi('HTTP_ERROR', 503, 'x').esTransitorio).toBe(true);
    expect(new ErrorApi('CONSENT_REQUIRED', 403, 'x').esTransitorio).toBe(false);
  });

  it('resuelve el 204 del borrado sin intentar parsear cuerpo', async () => {
    const { api, llamadas } = cliente([{ status: 204 }]);

    await expect(api.borrarCuenta()).resolves.toBeUndefined();
    expect(llamadas[0].init.method).toBe('DELETE');
  });
});
