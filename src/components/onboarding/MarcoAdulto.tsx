/**
 * Marco compartido de los cuatro pasos del onboarding adulto: cabecera con el
 * progreso, boton de volver y tarjeta central. Presentacion pura.
 */

import type { ReactNode } from 'react';
import { orden } from './orden';

/** Los cuatro pasos, en el orden del flujo de consentimiento. */
export const PASOS_ONBOARDING = ['Edad', 'Cuenta', 'Permisos', 'Perfil'] as const;

interface Props {
  /** Indice del paso actual dentro de `PASOS_ONBOARDING`. */
  pasoActual: number;
  kicker: string;
  titulo: ReactNode;
  /** Bajada breve; explica qué se pide y por qué. */
  descripcion?: ReactNode;
  onVolver?: () => void;
  children: ReactNode;
  /** Ancho de la tarjeta: el paso de perfil necesita más aire. */
  ancho?: 'normal' | 'amplio';
  /** Panel contextual sticky en desktop; en móvil no se muestra. */
  lateral?: ReactNode;
}

export function MarcoAdulto({
  pasoActual,
  kicker,
  titulo,
  descripcion,
  onVolver,
  children,
  ancho = 'normal',
  lateral,
}: Props) {
  return (
    <div
      className={`ad-contenido mx-auto px-6 pb-20 pt-10 sm:px-10 ${
        lateral ? 'max-w-5xl' : ancho === 'amplio' ? 'max-w-3xl' : 'max-w-xl'
      }`}
    >
      {/* --- Progreso ------------------------------------------------------ */}
      <nav className="ad-revela" style={orden(0)} aria-label="Progreso del registro">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          {PASOS_ONBOARDING.map((paso, i) => {
            const hecho = i < pasoActual;
            const actual = i === pasoActual;
            return (
              <li key={paso} className="flex items-center gap-2">
                <span
                  aria-current={actual ? 'step' : undefined}
                  className={`flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] ${
                    actual
                      ? 'text-[var(--color-ad-acento-claro)]'
                      : hecho
                        ? 'text-[var(--color-ad-texto-suave)]'
                        : 'text-[var(--color-ad-texto-tenue)]'
                  }`}
                >
                  <span aria-hidden="true" className="font-normal tabular-nums opacity-70">
                    {hecho ? '✓' : String(i + 1).padStart(2, '0')}
                  </span>
                  {paso}
                </span>
                {i < PASOS_ONBOARDING.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`h-px w-5 sm:w-8 ${
                      hecho ? 'bg-[var(--color-ad-acento)]' : 'bg-[var(--color-ad-borde)]'
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className={lateral ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14' : ''}>
        <div>
          {/* --- Encabezado ------------------------------------------------ */}
          <header className="ad-revela mt-12" style={orden(1)}>
            <p className="ad-kicker">{kicker}</p>
            <h1 className="ad-display mt-4 text-[2.05rem] leading-[1.06] sm:text-[2.5rem]">
              {titulo}
            </h1>
            {descripcion && (
              <p className="mt-5 text-[0.9375rem] leading-relaxed text-[var(--color-ad-texto-suave)]">
                {descripcion}
              </p>
            )}
          </header>

          {/* --- Contenido del paso ---------------------------------------- */}
          <div className="ad-revela mt-9" style={orden(2)}>
            {children}
          </div>

          {onVolver && (
            <button
              type="button"
              onClick={onVolver}
              className="ad-revela mt-9 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-[var(--color-ad-texto-suave)] transition-colors hover:bg-[rgb(47_107_255/0.12)] hover:text-[var(--color-ad-texto)]"
              style={orden(3)}
            >
              <span aria-hidden="true">←</span> Volver
            </button>
          )}
        </div>

        {lateral && (
          <aside className="ad-revela hidden lg:block" style={orden(3)} aria-label="Información del paso">
            <div className="sticky top-10 mt-12">{lateral}</div>
          </aside>
        )}
      </div>
    </div>
  );
}
