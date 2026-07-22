/**
 * Selector de proveedor: decide una sola vez cual LLM usa la sesion.
 *
 * Orden: Prompt API on-device -> Lambda -> guion local.
 * La UI llama a obtenerProveedor() y no se entera de cual gano.
 */

import { ProveedorPromptApi } from './promptApi';
import { ProveedorLambda } from './lambdaClient';
import { filtrarRespuesta } from './guardrails';
import type { ContextoConversacion, ProveedorLlm, RespuestaEstafador } from './tipos';

export * from './tipos';

/** Ultimo recurso: siempre responde, nunca falla, sin red ni modelo. */
class ProveedorGuionLocal implements ProveedorLlm {
  readonly nombre = 'guion-local' as const;

  async estaDisponible(): Promise<boolean> {
    return true;
  }

  async responder(contexto: ContextoConversacion): Promise<RespuestaEstafador> {
    const { texto } = filtrarRespuesta('', contexto.historial.length);
    return { texto, origen: 'guion-local', filtrada: true };
  }
}

let proveedorElegido: ProveedorLlm | null = null;

export async function obtenerProveedor(): Promise<ProveedorLlm> {
  if (proveedorElegido) return proveedorElegido;

  const candidatos: ProveedorLlm[] = [
    new ProveedorPromptApi(),
    new ProveedorLambda(),
    new ProveedorGuionLocal(),
  ];

  for (const candidato of candidatos) {
    if (await candidato.estaDisponible()) {
      proveedorElegido = candidato;
      return candidato;
    }
  }

  proveedorElegido = candidatos[candidatos.length - 1];
  return proveedorElegido;
}

/** Solo para tests: olvida la eleccion previa. */
export function reiniciarProveedor(): void {
  proveedorElegido = null;
}
