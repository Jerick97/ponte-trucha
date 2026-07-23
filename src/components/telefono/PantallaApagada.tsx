/** Pantalla negra inicial con el unico CTA: encender el telefono. */

interface Props {
  onEncender: () => void;
}

export function PantallaApagada({ onEncender }: Props) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-[var(--color-pantalla-apagada)]">
      <button
        type="button"
        onClick={onEncender}
        className="flex min-h-14 flex-col items-center gap-3 rounded-2xl px-8 py-4 text-[var(--color-lock-texto)]/70 transition hover:text-[var(--color-lock-texto)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-marca-500)]"
      >
        {/* Simbolo de encendido dibujado: no depende de fuentes del sistema */}
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-10 w-10" fill="none">
          <path d="M12 3v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path
            d="M7.5 6.2a7.5 7.5 0 1 0 9 0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-sm tracking-widest">ENCENDER</span>
      </button>
    </div>
  );
}
