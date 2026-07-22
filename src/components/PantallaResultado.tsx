/**
 * Cierre de la partida: el "nivel de trucha", compartible.
 * Es la pantalla que sale en el video, asi que merece el mejor pulido visual.
 */

import type { EstadoPartida } from '../game/motor';
import { porcentajeAciertos, type NivelTrucha } from '../game/nivelTrucha';

interface Props {
  partida: EstadoPartida;
  nivel: NivelTrucha;
  onReiniciar: () => void;
}

export function PantallaResultado({ partida, nivel, onReiniciar }: Props) {
  const porcentaje = porcentajeAciertos(partida);

  async function compartir() {
    const texto = `Soy nivel ${nivel.titulo} ${nivel.emoji} en Ponte Trucha Kids: ${porcentaje}% de estafas detectadas. ¿Te atreves?`;
    if (navigator.share) {
      await navigator.share({ text: texto, url: window.location.href }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(`${texto} ${window.location.href}`).catch(() => undefined);
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
      <p className="text-7xl" aria-hidden>
        {nivel.emoji}
      </p>
      <div>
        <p className="text-sm uppercase tracking-widest text-[var(--color-texto-suave)]">
          Tu nivel de trucha
        </p>
        <h2 className="text-3xl font-black" style={{ color: nivel.color }}>
          {nivel.titulo}
        </h2>
      </div>

      <p className="max-w-[280px] text-[15px] text-[var(--color-texto-suave)]">{nivel.frase}</p>

      <dl className="grid w-full max-w-[280px] grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <dt className="text-xs text-[var(--color-texto-suave)]">Puntaje</dt>
          <dd className="text-lg font-bold">{partida.puntaje}</dd>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <dt className="text-xs text-[var(--color-texto-suave)]">Aciertos</dt>
          <dd className="text-lg font-bold">{porcentaje}%</dd>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <dt className="text-xs text-[var(--color-texto-suave)]">Racha</dt>
          <dd className="text-lg font-bold">{partida.mejorRacha}</dd>
        </div>
      </dl>

      <div className="flex w-full max-w-[280px] flex-col gap-2">
        <button
          type="button"
          onClick={compartir}
          className="min-h-12 rounded-2xl bg-[var(--color-marca-500)] px-4 font-bold text-white"
        >
          Compartir mi nivel
        </button>
        <button
          type="button"
          onClick={onReiniciar}
          className="min-h-12 rounded-2xl border-2 border-[var(--color-marca-500)] px-4 font-bold text-[var(--color-marca-600)]"
        >
          Jugar otra vez
        </button>
      </div>
    </div>
  );
}
