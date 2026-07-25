/**
 * Paso 1: comprobacion de mayoria de edad.
 *
 * La fecha vive en el estado local de este componente y muere con el: no sube
 * al store, no se persiste y no se envia a ninguna parte. Lo unico que sale de
 * aqui es la `PruebaAgeGate` (version de regla + timestamp).
 */

import { useState } from 'react';
import { EyeOff, FileCheck2, Lock, Trash2 } from 'lucide-react';
import { evaluarAgeGate, type PruebaAgeGate } from '../../onboarding/ageGate';
import { MarcoAdulto } from './MarcoAdulto';
import { PanelLateral } from './PanelLateral';

interface Props {
  onAprobado: (prueba: PruebaAgeGate) => void;
  onVolver: () => void;
}

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export function PasoAgeGate({ onAprobado, onVolver }: Props) {
  const [dia, setDia] = useState('');
  const [mes, setMes] = useState('');
  const [anio, setAnio] = useState('');
  const [error, setError] = useState<string | null>(null);

  const completo = dia !== '' && mes !== '' && anio.length === 4;

  function comprobar(e: React.FormEvent) {
    e.preventDefault();
    const resultado = evaluarAgeGate(
      { dia: Number(dia), mes: Number(mes), anio: Number(anio) },
      new Date(),
    );
    if (!resultado.aprobado) {
      setError(resultado.motivo);
      return;
    }
    // La fecha ya cumplio su unico proposito. Se limpia de la memoria del
    // componente antes de avanzar.
    setDia('');
    setMes('');
    setAnio('');
    setError(null);
    onAprobado(resultado.prueba);
  }

  return (
    <MarcoAdulto
      pasoActual={0}
      kicker="Paso 1 de 4"
      titulo={
        <>
          Antes de empezar,
          <br />
          confirmemos que eres el adulto.
        </>
      }
      descripcion={
        <>
          Esta cuenta la abre la madre, el padre o el tutor. Necesitamos tu fecha de
          nacimiento solo para comprobarlo:{' '}
          <strong className="text-[var(--color-ad-texto)]">no la guardamos</strong> ni la
          enviamos a ningún servidor.
        </>
      }
      onVolver={onVolver}
      lateral={
        <PanelLateral
          kicker="Qué pasa con tu fecha"
          items={[
            {
              icono: EyeOff,
              titulo: 'Se comprueba aquí mismo',
              texto: 'La fecha se evalúa en tu navegador. No viaja a ningún servidor.',
            },
            {
              icono: Trash2,
              titulo: 'Se descarta al instante',
              texto: 'Pasado el filtro, la fecha se borra de la memoria.',
            },
            {
              icono: FileCheck2,
              titulo: 'Solo queda un sello',
              texto: 'Guardamos la versión de la regla y la hora de aprobación. Nada más.',
            },
          ]}
        />
      }
    >
      <form onSubmit={comprobar} noValidate>
        <fieldset className="ad-tarjeta border-0 p-6 sm:p-7">
          <legend className="sr-only">Tu fecha de nacimiento</legend>

          <div className="grid grid-cols-[5rem_1fr_6rem] gap-3">
            <div>
              <label htmlFor="ag-dia" className="mb-2 block text-xs text-[var(--color-ad-texto-tenue)]">
                Día
              </label>
              <input
                id="ag-dia"
                className={`ad-campo text-center ${error ? 'ad-campo--invalido' : ''}`}
                inputMode="numeric"
                autoComplete="off"
                maxLength={2}
                placeholder="15"
                value={dia}
                onChange={(e) => {
                  setDia(e.target.value.replace(/\D/g, ''));
                  setError(null);
                }}
              />
            </div>

            <div>
              <label htmlFor="ag-mes" className="mb-2 block text-xs text-[var(--color-ad-texto-tenue)]">
                Mes
              </label>
              <select
                id="ag-mes"
                className={`ad-campo ${error ? 'ad-campo--invalido' : ''}`}
                value={mes}
                onChange={(e) => {
                  setMes(e.target.value);
                  setError(null);
                }}
              >
                <option value="">Elige</option>
                {MESES.map((nombre, i) => (
                  <option key={nombre} value={i + 1}>
                    {nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ag-anio" className="mb-2 block text-xs text-[var(--color-ad-texto-tenue)]">
                Año
              </label>
              <input
                id="ag-anio"
                className={`ad-campo text-center ${error ? 'ad-campo--invalido' : ''}`}
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                placeholder="1988"
                value={anio}
                onChange={(e) => {
                  setAnio(e.target.value.replace(/\D/g, ''));
                  setError(null);
                }}
              />
            </div>
          </div>

          {/* El motivo es deliberadamente vago: un mensaje mas util aqui seria
              un mapa para evadir el gate (R1). */}
          <p aria-live="polite" className="min-h-5 pt-4 text-sm text-[var(--color-trampa)]">
            {error}
          </p>

          <button
            type="submit"
            disabled={!completo}
            className="ad-boton ad-boton--primario mt-1 w-full"
          >
            Continuar
          </button>
        </fieldset>

        <p className="mt-5 flex items-start gap-2.5 text-xs leading-relaxed text-[var(--color-ad-texto-tenue)]">
          <Lock
            className="mt-px h-3.5 w-3.5 flex-none text-[var(--color-ad-acento-claro)]"
            aria-hidden="true"
          />
          Esta comprobación no es una verificación de identidad. Es un primer filtro para que
          la cuenta quede en manos de un adulto.
        </p>
      </form>
    </MarcoAdulto>
  );
}
