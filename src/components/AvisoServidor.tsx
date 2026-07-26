/**
 * Aviso cuando el servidor no pudo responder.
 *
 * Habla en el tono del juego (`tono-infantil.md`): dice qué pasó y qué hacer,
 * sin códigos, sin jerga y sin asustar. No es una pantalla: se apoya sobre el
 * teléfono para que el niño no pierda el contexto de lo que estaba haciendo.
 */

interface Props {
  mensaje: string;
  /** Si viene, se ofrece reintentar la última llamada. */
  onReintentar?: () => void;
}

export function AvisoServidor({ mensaje, onReintentar }: Props) {
  return (
    <div
      role="alert"
      className="absolute inset-x-4 bottom-8 z-40 rounded-2xl bg-[var(--color-carcasa)] p-4 text-center shadow-lg"
    >
      <p className="text-sm font-semibold text-[var(--color-texto)]">{mensaje}</p>
      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          className="mt-3 min-h-11 w-full rounded-2xl bg-[var(--color-marca-500)] px-4 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-marca-500)]"
        >
          Intentar otra vez
        </button>
      )}
    </div>
  );
}
