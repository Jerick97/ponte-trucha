/**
 * Resaltado de senales delatoras dentro de un mensaje. Mismo algoritmo
 * que la Burbuja original: se parte el texto en trozos marcando los
 * fragmentos literales que delatan la estafa.
 */

import type { SenalDelatora } from '../../types/escenario';

export interface ParteMensaje {
  texto: string;
  resaltado: boolean;
}

export function partirPorSenales(
  texto: string,
  senales: readonly SenalDelatora[],
): ParteMensaje[] {
  const fragmentos = senales
    .map((s) => s.fragmento)
    .filter((f) => texto.includes(f))
    .sort((a, b) => texto.indexOf(a) - texto.indexOf(b));

  const partes: ParteMensaje[] = [];
  let resto = texto;

  for (const fragmento of fragmentos) {
    const posicion = resto.indexOf(fragmento);
    if (posicion < 0) continue;
    if (posicion > 0) partes.push({ texto: resto.slice(0, posicion), resaltado: false });
    partes.push({ texto: fragmento, resaltado: true });
    resto = resto.slice(posicion + fragmento.length);
  }

  if (resto) partes.push({ texto: resto, resaltado: false });
  return partes;
}
