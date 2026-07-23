/**
 * Recorte del mensaje para el banner de notificacion. Funcion pura:
 * la UI muestra una probadita del mensaje sin partir palabras.
 */

/** Largo maximo de la vista previa, elipsis incluida. */
export const LARGO_VISTA_PREVIA = 80;

const ELIPSIS = '…';

export function recortarVistaPrevia(texto: string, maximo: number = LARGO_VISTA_PREVIA): string {
  if (texto.length <= maximo) return texto;

  const espacioDisponible = maximo - ELIPSIS.length;
  const corte = texto.slice(0, espacioDisponible + 1);
  const ultimoEspacio = corte.lastIndexOf(' ');

  // Sin espacio donde cortar (palabra gigante): corte duro.
  const prefijo =
    ultimoEspacio > 0 ? corte.slice(0, ultimoEspacio) : texto.slice(0, espacioDisponible);

  return prefijo.trimEnd() + ELIPSIS;
}
