/**
 * Plan A: Prompt API de Chrome (Gemini Nano on-device).
 *
 * Ventaja que vendemos en el video: ningun dato del nino sale del navegador,
 * no hay costo por token y la latencia es minima.
 *
 * La API es experimental y su forma cambia entre versiones de Chrome, por eso
 * toda la interaccion pasa por este archivo y se declara el tipo localmente.
 * Docs: https://developer.chrome.com/docs/ai/prompt-api
 */

import { construirSystemPrompt, construirUserPrompt } from './prompts';
import { filtrarRespuesta } from './guardrails';
import type { ContextoConversacion, ProveedorLlm, RespuestaEstafador } from './tipos';

/** Forma minima de la Prompt API que usamos. */
interface SesionLenguaje {
  prompt(entrada: string): Promise<string>;
  destroy(): void;
}

interface ApiLenguaje {
  availability?(): Promise<'unavailable' | 'downloadable' | 'downloading' | 'available'>;
  create(opciones: { initialPrompts?: Array<{ role: string; content: string }> }): Promise<SesionLenguaje>;
}

/** Lee el global sin romper el tipado ni asumir que existe. */
function obtenerApi(): ApiLenguaje | null {
  const global = globalThis as unknown as { LanguageModel?: ApiLenguaje };
  return global.LanguageModel ?? null;
}

export class ProveedorPromptApi implements ProveedorLlm {
  readonly nombre = 'on-device' as const;

  private sesion: SesionLenguaje | null = null;

  async estaDisponible(): Promise<boolean> {
    const api = obtenerApi();
    if (!api) return false;
    if (!api.availability) return true;
    try {
      const estado = await api.availability();
      return estado === 'available';
    } catch {
      return false;
    }
  }

  /** Crea (o reutiliza) la sesion con el system prompt del escenario. */
  private async obtenerSesion(contexto: ContextoConversacion): Promise<SesionLenguaje | null> {
    if (this.sesion) return this.sesion;
    const api = obtenerApi();
    if (!api) return null;

    this.sesion = await api.create({
      initialPrompts: [{ role: 'system', content: construirSystemPrompt(contexto) }],
    });
    return this.sesion;
  }

  async responder(contexto: ContextoConversacion): Promise<RespuestaEstafador> {
    try {
      const sesion = await this.obtenerSesion(contexto);
      if (!sesion) {
        return { texto: '', origen: 'on-device', filtrada: true };
      }
      const crudo = await sesion.prompt(construirUserPrompt(contexto));
      const { texto, filtrada } = filtrarRespuesta(crudo, contexto.historial.length);
      return { texto, origen: 'on-device', filtrada };
    } catch {
      const { texto } = filtrarRespuesta('', contexto.historial.length);
      return { texto, origen: 'on-device', filtrada: true };
    }
  }

  /** Libera la sesion al cambiar de escenario: cada estafador es distinto. */
  cerrar(): void {
    this.sesion?.destroy();
    this.sesion = null;
  }
}
