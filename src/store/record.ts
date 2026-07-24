/**
 * Record personal en localStorage. Es el unico dato que se persiste, y va
 * solo en el dispositivo del nino (lo permite seguridad-infantil.md): sin
 * nombre, sin correo, sin nada que identifique a nadie.
 */

import type { EstadoPartida } from '../game/motor';
import type { NivelTrucha } from '../game/nivelTrucha';

const CLAVE = 'ponte-trucha:record';

export interface RecordGuardado {
  puntaje: number;
  mejorRacha: number;
  nivelTitulo: string;
  nivelEmoji: string;
}

/** Lee el record guardado, o null si no hay o si localStorage no esta. */
export function leerRecord(): RecordGuardado | null {
  try {
    const crudo = localStorage.getItem(CLAVE);
    return crudo ? (JSON.parse(crudo) as RecordGuardado) : null;
  } catch {
    return null;
  }
}

/**
 * Guarda la partida si supera al record previo (por puntaje).
 * Devuelve true si fue un nuevo record.
 */
export function guardarSiEsMejor(partida: EstadoPartida, nivel: NivelTrucha): boolean {
  const previo = leerRecord();
  if (previo && partida.puntaje <= previo.puntaje) return false;

  const nuevo: RecordGuardado = {
    puntaje: partida.puntaje,
    mejorRacha: partida.mejorRacha,
    nivelTitulo: nivel.titulo,
    nivelEmoji: nivel.emoji,
  };
  try {
    localStorage.setItem(CLAVE, JSON.stringify(nuevo));
  } catch {
    // Sin localStorage: el juego sigue, solo no persiste el record.
  }
  return true;
}
