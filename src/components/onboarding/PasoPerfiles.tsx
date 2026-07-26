/**
 * Elegir quien juega, cuando la cuenta ya tiene perfiles.
 *
 * Existe para que el progreso no se pierda: si el adulto vuelve a entrar y no
 * puede elegir el perfil de siempre, se crea uno nuevo y el avance anterior
 * queda inalcanzable. La lista viene de `GET /v1/perfiles`; el navegador no
 * inventa ningun `childId`.
 */

import { UserPlus } from 'lucide-react';
import {
  MAX_PERFILES,
  emojiAvatar,
  etiquetaAlias,
  type PerfilInfantil,
} from '../../onboarding/perfilInfantil';
import { BANDAS } from '../../onboarding/perfilInfantil';
import { MarcoAdulto } from './MarcoAdulto';

interface Props {
  perfiles: readonly PerfilInfantil[];
  onElegir: (childId: string) => void;
  onCrear: () => void;
  onVolver: () => void;
}

function etiquetaBanda(banda: PerfilInfantil['banda']): string {
  return BANDAS.find((candidata) => candidata.clave === banda)?.etiqueta ?? '';
}

export function PasoPerfiles({ perfiles, onElegir, onCrear, onVolver }: Props) {
  const lleno = perfiles.length >= MAX_PERFILES;

  return (
    <MarcoAdulto
      pasoActual={3}
      kicker="¿Quién juega?"
      titulo="Elige el perfil."
      descripcion="El avance, los puntos y la dificultad están guardados en el perfil. Elige el de siempre para seguir donde quedó."
      onVolver={onVolver}
      ancho="amplio"
    >
      <ul className="grid gap-3 sm:grid-cols-2">
        {perfiles.map((perfil) => (
          <li key={perfil.childId}>
            <button
              type="button"
              onClick={() => onElegir(perfil.childId)}
              className="ad-tarjeta flex w-full items-center gap-4 p-5 text-left transition-colors hover:border-[var(--color-ad-acento-claro)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-ad-acento-claro)]"
            >
              <span
                aria-hidden="true"
                className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl border border-[var(--color-ad-borde)] bg-[rgb(8_11_26/0.6)] text-2xl"
              >
                {emojiAvatar(perfil.avatarId)}
              </span>
              <span className="min-w-0">
                <span className="ad-display block text-[1.3rem]">
                  {etiquetaAlias(perfil.aliasId)}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--color-ad-texto-tenue)]">
                  {etiquetaBanda(perfil.banda)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onCrear}
        disabled={lleno}
        className="ad-boton ad-boton--primario mt-8 inline-flex w-full items-center justify-center gap-2 sm:w-auto"
      >
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        Crear otro perfil
      </button>

      <p className="mt-4 text-xs leading-relaxed text-[var(--color-ad-texto-tenue)]">
        {lleno
          ? `Esta cuenta llegó al máximo de ${MAX_PERFILES} perfiles. Borra uno desde el área de padres para crear otro.`
          : `Puedes tener hasta ${MAX_PERFILES} perfiles en esta cuenta.`}
      </p>
    </MarcoAdulto>
  );
}
