/**
 * Plan B: AWS Lambda (Function URL) + Mistral.
 *
 * Se usa solo si el navegador no soporta la Prompt API. La Lambda recibe
 * el escenario y el historial, arma el prompt del lado servidor y devuelve
 * una sola linea de texto. Contrato en infra/lambda/README.md.
 *
 * No se envia ningun dato personal del nino: solo el id del escenario y
 * lo que el propio nino escribio en el chat simulado.
 */

import { filtrarRespuesta } from './guardrails';
import type { ContextoConversacion, ProveedorLlm, RespuestaEstafador } from './tipos';

const TIMEOUT_MS = 4000;

export class ProveedorLambda implements ProveedorLlm {
  readonly nombre = 'lambda' as const;

  constructor(private readonly endpoint: string = import.meta.env.VITE_LLM_ENDPOINT ?? '') {}

  async estaDisponible(): Promise<boolean> {
    return this.endpoint.length > 0;
  }

  async responder(contexto: ContextoConversacion): Promise<RespuestaEstafador> {
    if (!this.endpoint) {
      const { texto } = filtrarRespuesta('', contexto.historial.length);
      return { texto, origen: 'lambda', filtrada: true };
    }

    try {
      const respuesta = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        body: JSON.stringify({
          escenarioId: contexto.escenario.id,
          perfilEstafador: contexto.escenario.perfilEstafador,
          mensajeOriginal: contexto.escenario.mensaje,
          historial: contexto.historial,
        }),
      });

      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

      const datos = (await respuesta.json()) as { texto?: string };
      const { texto, filtrada } = filtrarRespuesta(datos.texto ?? '', contexto.historial.length);
      return { texto, origen: 'lambda', filtrada };
    } catch {
      const { texto } = filtrarRespuesta('', contexto.historial.length);
      return { texto, origen: 'lambda', filtrada: true };
    }
  }
}
