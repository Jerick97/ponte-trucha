/**
 * Contrato comun de los proveedores del estafador conversacional.
 *
 * Hay dos implementaciones intercambiables:
 * - promptApi.ts  -> Prompt API de Chrome (Gemini Nano, on-device). Plan A.
 * - lambdaClient.ts -> AWS Lambda + Mistral. Plan B (fallback).
 *
 * La UI nunca sabe cual esta corriendo: solo usa ProveedorLlm.
 */

import type { Escenario } from '../types/escenario';

export type OrigenRespuesta = 'on-device' | 'lambda' | 'guion-local';

/** Un turno de la conversacion con el estafador. */
export interface TurnoChat {
  autor: 'nino' | 'estafador';
  texto: string;
}

export interface RespuestaEstafador {
  texto: string;
  origen: OrigenRespuesta;
  /** True si el guardrail corto o reemplazo la respuesta del modelo. */
  filtrada: boolean;
}

export interface ContextoConversacion {
  escenario: Escenario;
  historial: readonly TurnoChat[];
}

export interface ProveedorLlm {
  /** Nombre legible, se muestra en el badge de debug. */
  readonly nombre: OrigenRespuesta;
  /** Comprueba si el proveedor puede usarse en este navegador/entorno. */
  estaDisponible(): Promise<boolean>;
  /** Genera la siguiente linea del estafador. Nunca debe lanzar: devuelve fallback. */
  responder(contexto: ContextoConversacion): Promise<RespuestaEstafador>;
}
