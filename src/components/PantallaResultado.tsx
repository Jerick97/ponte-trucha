/**
 * Cierre de la partida: el "nivel de trucha", compartible.
 * Es la pantalla que sale en el video, asi que merece el mejor pulido visual.
 */

import { useEffect } from 'react';
import type { EstadoPartida } from '../game/motor';
import { porcentajeAciertos, type NivelTrucha } from '../game/nivelTrucha';
import type { Medalla } from '../game/medallas';
import { Confetti } from './Confetti';
import { reproducirFanfarria } from './sonidoRacha';

interface Props {
  partida: EstadoPartida;
  nivel: NivelTrucha;
  medallas: Medalla[];
  esRecord: boolean;
  onReiniciar: () => void;
}

export function PantallaResultado({ partida, nivel, medallas, esRecord, onReiniciar }: Props) {
  const porcentaje = porcentajeAciertos(partida);

  // Fanfarria de victoria al llegar a la pantalla final (una sola vez).
  useEffect(() => {
    reproducirFanfarria();
  }, []);

  async function compartir() {
    const texto = `Soy nivel ${nivel.titulo} ${nivel.emoji} en Ponte Trucha Kids: ${porcentaje}% de estafas detectadas. ¿Te atreves?`;
    if (navigator.share) {
      await navigator.share({ text: texto, url: window.location.href }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(`${texto} ${window.location.href}`).catch(() => undefined);
  }

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-5 text-center">
      <Confetti piezas={44} />
      <p className="nivel-revela text-7xl" aria-hidden>
        {nivel.emoji}
      </p>
      <p className="nivel-revela text-sm font-bold uppercase tracking-widest text-[var(--color-nivel-despierto)]">
        ¡Subiste de nivel!
      </p>
      <div>
        <p className="text-sm uppercase tracking-widest text-[var(--color-texto-suave)]">
          Tu nivel de trucha
        </p>
        <h2 className="text-3xl font-black" style={{ color: nivel.color }}>
          {nivel.titulo}
        </h2>
      </div>

      {esRecord && (
        <p className="nivel-revela rounded-full bg-[var(--color-nivel-despierto)] px-4 py-1 text-sm font-bold text-white">
          🏆 ¡Nuevo récord!
        </p>
      )}

      <p className="max-w-[280px] text-[15px] text-[var(--color-texto-suave)]">{nivel.frase}</p>

      {medallas.length > 0 && (
        <ul className="flex max-w-[280px] flex-wrap justify-center gap-2">
          {medallas.map((m) => (
            <li
              key={m.clave}
              title={m.detalle}
              className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-sm"
            >
              <span aria-hidden="true">{m.emoji}</span>
              {m.titulo}
            </li>
          ))}
        </ul>
      )}

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
