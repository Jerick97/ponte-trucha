/**
 * Estado global de audio: un solo interruptor de silencio, persistido en
 * localStorage. Los reproductores de sonido leen `estaSilenciado()` (lectura
 * no reactiva) y el boton de la UI usa el hook `useAudio`.
 *
 * Sin datos del nino: solo una preferencia booleana del dispositivo.
 */

import { create } from 'zustand';

const CLAVE = 'ponte-trucha:silenciado';

function leerInicial(): boolean {
  try {
    return localStorage.getItem(CLAVE) === '1';
  } catch {
    return false;
  }
}

interface EstadoAudio {
  silenciado: boolean;
  alternar: () => void;
}

export const useAudio = create<EstadoAudio>((set, get) => ({
  silenciado: leerInicial(),
  alternar: () => {
    const silenciado = !get().silenciado;
    try {
      localStorage.setItem(CLAVE, silenciado ? '1' : '0');
    } catch {
      // Sin localStorage: el silencio funciona en memoria durante la sesion.
    }
    set({ silenciado });
  },
}));

/** Lectura no reactiva para los reproductores de sonido. */
export function estaSilenciado(): boolean {
  return useAudio.getState().silenciado;
}
