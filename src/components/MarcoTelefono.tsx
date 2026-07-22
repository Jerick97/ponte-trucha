/**
 * Carcasa del telefono simulado. Todo el juego ocurre dentro de este marco.
 *
 * Owner: UI (Jerick). Este componente no conoce reglas del juego:
 * solo pinta el chrome del telefono y renderiza children.
 */

import type { ReactNode } from 'react';

interface Props {
  /** Nombre que aparece en la barra superior (el remitente o la app). */
  titulo: string;
  subtitulo?: string;
  /** Emoji o avatar del remitente. */
  avatar?: string;
  children: ReactNode;
  /** Zona fija al pie: barra de decision o input de chat. */
  pie?: ReactNode;
}

export function MarcoTelefono({ titulo, subtitulo, avatar, children, pie }: Props) {
  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-[420px] items-center justify-center p-3">
      <div className="flex h-full max-h-[860px] w-full flex-col overflow-hidden rounded-[var(--radius-telefono)] bg-[var(--color-telefono)] shadow-2xl ring-1 ring-black/10">
        <header className="flex items-center gap-3 border-b border-black/5 bg-white px-4 py-3">
          <span aria-hidden className="text-2xl">
            {avatar ?? '💬'}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--color-texto)]">{titulo}</p>
            {subtitulo && (
              <p className="truncate text-xs text-[var(--color-texto-suave)]">{subtitulo}</p>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[var(--color-burbuja-entrante)]/40 px-4 py-4">
          {children}
        </main>

        {pie && <footer className="border-t border-black/5 bg-white p-3">{pie}</footer>}
      </div>
    </div>
  );
}
