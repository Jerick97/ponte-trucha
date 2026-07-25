/**
 * Paso 3: aviso de privacidad y consentimientos separados.
 *
 * Reglas visibles aqui (R3, `tono-infantil.md`):
 * - una decision por finalidad, nunca un "acepto todo";
 * - las opcionales arrancan apagadas y se ven apagadas;
 * - cada tarjeta dice qué dato se usa, para qué y cómo retirarlo;
 * - sin patrones oscuros: rechazar es tan facil como aceptar.
 */

import { FileClock, ToggleLeft, Undo2 } from 'lucide-react';
import {
  FINALIDADES,
  VERSION_POLITICA,
  puedeUsar,
  type ClaveFinalidad,
  type MapaConsentimiento,
} from '../../onboarding/consentimiento';
import { MarcoAdulto } from './MarcoAdulto';
import { PanelLateral } from './PanelLateral';

interface Props {
  consentimiento: MapaConsentimiento;
  onDecidir: (clave: ClaveFinalidad, otorga: boolean) => void;
  onConfirmar: () => void;
  onVolver: () => void;
}

export function PasoConsentimiento({ consentimiento, onDecidir, onConfirmar, onVolver }: Props) {
  const coreOtorgado = puedeUsar(consentimiento, 'core');

  return (
    <MarcoAdulto
      pasoActual={2}
      kicker="Paso 3 de 4"
      titulo="Tú decides qué se activa."
      descripcion="Tres permisos separados. El primero es necesario para que exista la cuenta; los otros dos son opcionales y vienen apagados. Puedes cambiarlos cuando quieras."
      onVolver={onVolver}
      ancho="amplio"
      lateral={
        <PanelLateral
          kicker="Así funciona un permiso"
          items={[
            {
              icono: ToggleLeft,
              titulo: 'Apagado por defecto',
              texto: 'Nada opcional se activa solo. Lo que no enciendas, no existe.',
            },
            {
              icono: FileClock,
              titulo: 'Decisión versionada',
              texto: 'Cada permiso guarda cuándo se decidió y bajo qué versión del aviso.',
            },
            {
              icono: Undo2,
              titulo: 'Revocable siempre',
              texto: 'Apagar un permiso detiene su uso al instante.',
            },
          ]}
        />
      }
    >
      <ul className="grid gap-4">
        {FINALIDADES.map((f) => {
          const activo = puedeUsar(consentimiento, f.clave);
          return (
            <li key={f.clave} className="ad-tarjeta p-6">
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="ad-display text-[1.3rem]">{f.titulo}</h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.14em] ${
                        f.opcional
                          ? 'bg-[rgb(245_165_36/0.16)] text-[var(--color-nivel-despierto)]'
                          : 'bg-[rgb(47_107_255/0.18)] text-[var(--color-ad-acento-claro)]'
                      }`}
                    >
                      {f.opcional ? 'Opcional' : 'Necesario'}
                    </span>
                  </div>

                  <dl className="mt-4 grid gap-3 text-sm">
                    {[
                      { t: 'Qué se usa', d: f.queSeUsa },
                      { t: 'Para qué', d: f.paraQue },
                      { t: 'Cómo lo retiras', d: f.comoRetirar },
                    ].map((fila) => (
                      <div key={fila.t} className="grid gap-1 sm:grid-cols-[8.5rem_1fr] sm:gap-4">
                        <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-ad-texto-tenue)] sm:pt-0.5">
                          {fila.t}
                        </dt>
                        <dd className="leading-relaxed text-[var(--color-ad-texto-suave)]">
                          {fila.d}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={activo}
                  aria-label={`${activo ? 'Desactivar' : 'Activar'}: ${f.titulo}`}
                  onClick={() => onDecidir(f.clave, !activo)}
                  className="ad-switch mt-1"
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-8">
        <button
          type="button"
          onClick={onConfirmar}
          disabled={!coreOtorgado}
          className="ad-boton ad-boton--primario w-full sm:w-auto"
        >
          Guardar y continuar
        </button>

        <p aria-live="polite" className="mt-4 text-sm text-[var(--color-ad-texto-tenue)]">
          {coreOtorgado
            ? 'Listo. El siguiente paso es el perfil de tu hijo o hija.'
            : 'Para crear la cuenta necesitas activar «Cuenta y progreso».'}
        </p>
      </div>

      {/* Honestidad legal: no afirmamos cumplimiento sin revision legal
          (`seguridad-infantil.md`). */}
      <p className="mt-8 border-t border-[var(--color-ad-borde)] pt-6 text-xs leading-relaxed text-[var(--color-ad-texto-tenue)]">
        Aviso de privacidad <span className="tabular-nums">{VERSION_POLITICA}</span>. Si esta
        política cambia de forma importante, te volveremos a preguntar antes de seguir usando
        el permiso afectado. Este proyecto es un prototipo de hackathon y su mecanismo de
        consentimiento aún no ha pasado revisión legal.
      </p>
    </MarcoAdulto>
  );
}
