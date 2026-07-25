/**
 * Panel contextual del onboarding: acompaña al formulario en desktop para que
 * la columna central no flote en el vacio y el adulto lea, junto al campo,
 * que pasa con sus datos. Presentacion pura.
 */

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface ItemLateral {
  icono: LucideIcon;
  titulo: string;
  texto: string;
}

interface Props {
  kicker: string;
  items?: ItemLateral[];
  /** Contenido libre (p. ej. la vista previa del perfil). */
  children?: ReactNode;
}

export function PanelLateral({ kicker, items, children }: Props) {
  return (
    <div className="ad-tarjeta p-6">
      <p className="ad-kicker">{kicker}</p>
      {items && (
        <ul className="mt-5 grid gap-5">
          {items.map((item) => (
            <li key={item.titulo} className="flex items-start gap-3">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[rgb(47_107_255/0.14)]">
                <item.icono className="h-4 w-4 text-[var(--color-ad-acento-claro)]" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-ad-texto)]">{item.titulo}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-ad-texto-suave)]">
                  {item.texto}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {children}
    </div>
  );
}
