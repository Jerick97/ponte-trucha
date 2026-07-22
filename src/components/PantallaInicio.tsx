/** Portada del juego. Debe explicarse sola en 5 segundos. */

interface Props {
  onJugar: () => void;
}

export function PantallaInicio({ onJugar }: Props) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
      <div>
        <p className="text-6xl" aria-hidden>
          🐟
        </p>
        <h1 className="mt-2 text-3xl font-black text-[var(--color-texto)]">Ponte Trucha</h1>
        <p className="text-sm font-semibold text-[var(--color-marca-600)]">Kids</p>
      </div>

      <p className="max-w-[280px] text-[15px] text-[var(--color-texto-suave)]">
        Te van a llegar mensajes como los de tus juegos. Tú decides:{' '}
        <strong className="text-[var(--color-texto)]">¿trampa o de confianza?</strong>
      </p>

      <button
        type="button"
        onClick={onJugar}
        className="min-h-14 rounded-2xl bg-[var(--color-marca-500)] px-10 text-lg font-black text-white shadow-lg transition active:scale-[0.98]"
      >
        Jugar
      </button>

      <p className="max-w-[280px] text-xs text-[var(--color-texto-suave)]">
        No pedimos tu nombre ni tu correo. Nada de lo que escribes sale de este dispositivo.
      </p>
    </div>
  );
}
