/**
 * Paso 4: perfil infantil.
 *
 * Todo se ELIGE de un catalogo, no se escribe. No hay ni un `<input type=text>`
 * en esta pantalla, y es a proposito: si no existe campo libre, es imposible
 * que ahi termine el nombre real del nino (R4, `seguridad-infantil.md`).
 */

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import {
  ALIAS_CATALOGO,
  AVATARES_CATALOGO,
  BANDAS,
  etiquetaAlias,
  validarPerfil,
  type BandaEtaria,
  type SeleccionPerfil,
} from '../../onboarding/perfilInfantil';
import { MarcoAdulto } from './MarcoAdulto';
import { PanelLateral } from './PanelLateral';

interface Props {
  onCrear: (seleccion: SeleccionPerfil) => void;
  onVolver: () => void;
}

export function PasoPerfil({ onCrear, onVolver }: Props) {
  const [aliasId, setAliasId] = useState('');
  const [avatarId, setAvatarId] = useState('');
  const [banda, setBanda] = useState<BandaEtaria | ''>('');

  const seleccion = { aliasId, avatarId, banda } as SeleccionPerfil;
  const listo = banda !== '' && validarPerfil(seleccion).valido;
  const avatarElegido = AVATARES_CATALOGO.find((a) => a.id === avatarId);

  return (
    <MarcoAdulto
      pasoActual={3}
      kicker="Paso 4 de 4"
      titulo="El perfil de quien va a jugar."
      descripcion="Un apodo de la lista, un avatar y su rango de edad. Nada más: no pedimos su nombre, ni su edad exacta, ni una foto."
      onVolver={onVolver}
      ancho="amplio"
      lateral={
        <PanelLateral kicker="Así se verá">
          {/* Vista previa sticky: se actualiza en vivo con cada eleccion. */}
          <div className="mt-5 flex flex-col items-center rounded-xl border border-[var(--color-ad-borde)] bg-[rgb(8_11_26/0.55)] px-4 py-7 text-center">
            <div
              aria-hidden="true"
              className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[var(--color-ad-borde)] bg-[var(--color-ad-superficie-alta)] text-4xl"
            >
              {avatarElegido?.emoji ?? '·'}
            </div>
            <p className="ad-display mt-4 text-[1.35rem]">
              {aliasId ? etiquetaAlias(aliasId) : 'Sin apodo todavía'}
            </p>
            <p className="mt-1 text-xs text-[var(--color-ad-texto-tenue)]">
              {banda === ''
                ? 'Falta el rango de edad'
                : BANDAS.find((b) => b.clave === banda)?.etiqueta}
            </p>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-[var(--color-ad-texto-tenue)]">
            Esto es todo lo que el juego sabrá de tu hijo o hija.
          </p>
        </PanelLateral>
      }
    >
      {/* --- Vista previa compacta (solo móvil; en desktop va al lateral) --- */}
      <div className="ad-tarjeta mb-7 flex items-center gap-4 p-5 lg:hidden">
        <div
          aria-hidden="true"
          className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl border border-[var(--color-ad-borde)] bg-[rgb(8_11_26/0.6)] text-2xl"
        >
          {avatarElegido?.emoji ?? '·'}
        </div>
        <div className="min-w-0">
          <p className="ad-display text-[1.3rem]">
            {aliasId ? etiquetaAlias(aliasId) : 'Sin apodo todavía'}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-ad-texto-tenue)]">
            {banda === '' ? 'Falta el rango de edad' : BANDAS.find((b) => b.clave === banda)?.etiqueta}
          </p>
        </div>
      </div>

      {/* --- Apodo -------------------------------------------------------- */}
      <fieldset className="border-0">
        <legend className="ad-kicker mb-4">Apodo</legend>
        <div className="flex flex-wrap gap-2">
          {ALIAS_CATALOGO.map((a) => (
            <button
              key={a.id}
              type="button"
              aria-pressed={aliasId === a.id}
              onClick={() => setAliasId(a.id)}
              className="ad-chip px-4 py-2.5 text-sm font-medium"
            >
              {a.etiqueta}
            </button>
          ))}
        </div>
      </fieldset>

      {/* --- Avatar ------------------------------------------------------- */}
      <fieldset className="mt-9 border-0">
        <legend className="ad-kicker mb-4">Avatar</legend>
        <div className="flex flex-wrap gap-2">
          {AVATARES_CATALOGO.map((a) => (
            <button
              key={a.id}
              type="button"
              aria-pressed={avatarId === a.id}
              aria-label={a.etiqueta}
              onClick={() => setAvatarId(a.id)}
              className="ad-chip flex h-14 w-14 items-center justify-center text-2xl"
            >
              <span aria-hidden="true">{a.emoji}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* --- Banda etaria ------------------------------------------------- */}
      <fieldset className="mt-9 border-0">
        <legend className="ad-kicker mb-4">Rango de edad</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {BANDAS.map((b) => (
            <button
              key={b.clave}
              type="button"
              aria-pressed={banda === b.clave}
              onClick={() => setBanda(b.clave)}
              className="ad-chip px-5 py-4 text-left"
            >
              <span className="block text-sm font-semibold text-[var(--color-ad-texto)]">
                {b.etiqueta}
              </span>
              <span className="mt-1 block text-xs leading-snug">{b.detalle}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        disabled={!listo}
        onClick={() => onCrear(seleccion)}
        className="ad-boton ad-boton--primario mt-9 w-full sm:w-auto"
      >
        Crear perfil y jugar
      </button>

      <p className="mt-5 flex items-start gap-2.5 text-xs leading-relaxed text-[var(--color-ad-texto-tenue)]">
        <ShieldCheck
          className="mt-px h-3.5 w-3.5 flex-none text-[var(--color-ad-acento-claro)]"
          aria-hidden="true"
        />
        El perfil recibe un identificador al azar. Ni el apodo ni el avatar permiten saber
        quién es.
      </p>
    </MarcoAdulto>
  );
}
