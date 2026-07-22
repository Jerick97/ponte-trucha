/**
 * Burbuja de chat. Soporta resaltado de las senales delatoras:
 * en el feedback se marcan los fragmentos del mensaje que delataban la estafa.
 */

import type { SenalDelatora } from '../types/escenario';

interface Props {
  texto: string;
  propia?: boolean;
  /** Si viene, los fragmentos se resaltan dentro del texto. */
  senalesResaltadas?: readonly SenalDelatora[];
}

/** Parte el texto en trozos marcando los fragmentos a resaltar. */
function partirPorSenales(
  texto: string,
  senales: readonly SenalDelatora[],
): Array<{ texto: string; resaltado: boolean }> {
  const fragmentos = senales
    .map((s) => s.fragmento)
    .filter((f) => texto.includes(f))
    .sort((a, b) => texto.indexOf(a) - texto.indexOf(b));

  const partes: Array<{ texto: string; resaltado: boolean }> = [];
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

export function Burbuja({ texto, propia = false, senalesResaltadas }: Props) {
  const partes = senalesResaltadas?.length
    ? partirPorSenales(texto, senalesResaltadas)
    : [{ texto, resaltado: false }];

  return (
    <div className={`mb-3 flex ${propia ? 'justify-end' : 'justify-start'}`}>
      <p
        className={[
          'max-w-[80%] rounded-[var(--radius-burbuja)] px-4 py-2.5 text-[15px] leading-snug',
          propia
            ? 'bg-[var(--color-burbuja-propia)] text-[var(--color-texto)]'
            : 'bg-white text-[var(--color-texto)] shadow-sm',
        ].join(' ')}
      >
        {partes.map((parte, i) =>
          parte.resaltado ? (
            <mark
              key={i}
              className="rounded bg-[var(--color-trampa-suave)] px-0.5 font-semibold text-[var(--color-trampa)] decoration-wavy underline-offset-4"
            >
              {parte.texto}
            </mark>
          ) : (
            <span key={i}>{parte.texto}</span>
          ),
        )}
      </p>
    </div>
  );
}
