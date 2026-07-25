/**
 * Paso 2: cuenta del adulto (registro o inicio de sesion).
 *
 * MOCK: hoy no hay Cognito (`backend/` no existe todavia). El formulario valida
 * en el cliente y simula la respuesta para que el flujo sea recorrible en la
 * demo. La contrasena NUNCA sale de este componente ni se guarda: se descarta
 * al enviar. El reemplazo real es la tarea 9 de la spec (owner: Francis).
 */

import { useState } from 'react';
import { FlaskConical, SlidersHorizontal, Trash2, Users } from 'lucide-react';
import { MarcoAdulto } from './MarcoAdulto';
import { PanelLateral } from './PanelLateral';

interface Props {
  /** Estado de la operacion simulada: idle | loading | success | error. */
  cargando: boolean;
  error: string | null;
  onEnviar: (correo: string) => void;
  onVolver: () => void;
}

type Modo = 'registro' | 'ingreso';

/** Validacion mínima de forma; la de verdad la hará Cognito. */
function correoValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
}

const MINIMO_CLAVE = 8;

export function PasoAcceso({ cargando, error, onEnviar, onVolver }: Props) {
  const [modo, setModo] = useState<Modo>('registro');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [tocado, setTocado] = useState(false);

  const correoMal = tocado && correo !== '' && !correoValido(correo);
  const claveMal = tocado && modo === 'registro' && clave !== '' && clave.length < MINIMO_CLAVE;
  const listo = correoValido(correo) && (modo === 'ingreso' ? clave.length > 0 : clave.length >= MINIMO_CLAVE);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setTocado(true);
    if (!listo) return;
    // La clave se descarta aqui mismo: solo el correo sigue en la sesion.
    setClave('');
    onEnviar(correo.trim().toLowerCase());
  }

  const esRegistro = modo === 'registro';

  return (
    <MarcoAdulto
      pasoActual={1}
      kicker="Paso 2 de 4"
      titulo={esRegistro ? 'Crea tu cuenta de adulto.' : 'Entra a tu cuenta.'}
      descripcion={
        esRegistro
          ? 'Con este correo administras los permisos y el perfil de tu hijo o hija. Él o ella no necesita cuenta: juega desde la tuya.'
          : 'Usa el correo con el que creaste la cuenta.'
      }
      onVolver={onVolver}
      lateral={
        <PanelLateral
          kicker="Tu cuenta manda"
          items={[
            {
              icono: SlidersHorizontal,
              titulo: 'Permisos a tu cargo',
              texto: 'Activas o apagas cada permiso cuando quieras, desde el área de padres.',
            },
            {
              icono: Users,
              titulo: 'Perfiles sin datos',
              texto: 'El perfil de tu hijo se crea sin nombre real, correo ni fecha de nacimiento.',
            },
            {
              icono: Trash2,
              titulo: 'Borrado total',
              texto: 'Puedes eliminar la cuenta y todo lo guardado en cualquier momento.',
            },
          ]}
        />
      }
    >
      <form onSubmit={enviar} noValidate>
        <div className="ad-tarjeta p-6 sm:p-7">
          {/* --- Alternador registro / ingreso ---------------------------- */}
          <div
            role="tablist"
            aria-label="Registro o inicio de sesión"
            className="mb-7 grid grid-cols-2 gap-1 rounded-full border border-[var(--color-ad-borde)] bg-[rgb(8_11_26/0.6)] p-1"
          >
            {(['registro', 'ingreso'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={modo === m}
                onClick={() => {
                  setModo(m);
                  setTocado(false);
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  modo === m
                    ? 'bg-[rgb(47_107_255/0.25)] text-[var(--color-ad-texto)] shadow-[0_0_0_1px_rgb(123_163_255/0.45)_inset]'
                    : 'text-[var(--color-ad-texto-suave)] hover:text-[var(--color-ad-texto)]'
                }`}
              >
                {m === 'registro' ? 'Crear cuenta' : 'Ya tengo cuenta'}
              </button>
            ))}
          </div>

          <div className="grid gap-5">
            <div>
              <label htmlFor="ac-correo" className="mb-2 block text-xs text-[var(--color-ad-texto-tenue)]">
                Tu correo
              </label>
              <input
                id="ac-correo"
                type="email"
                className={`ad-campo ${correoMal ? 'ad-campo--invalido' : ''}`}
                autoComplete="email"
                placeholder="tucorreo@ejemplo.com"
                value={correo}
                aria-invalid={correoMal}
                aria-describedby={correoMal ? 'ac-correo-error' : undefined}
                onChange={(e) => setCorreo(e.target.value)}
                onBlur={() => setTocado(true)}
              />
              {correoMal && (
                <p id="ac-correo-error" className="mt-2 text-xs text-[var(--color-trampa)]">
                  Revisa el correo: parece incompleto.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="ac-clave" className="mb-2 block text-xs text-[var(--color-ad-texto-tenue)]">
                Tu contraseña
              </label>
              <div className="relative">
                <input
                  id="ac-clave"
                  type={verClave ? 'text' : 'password'}
                  className={`ad-campo pr-20 ${claveMal ? 'ad-campo--invalido' : ''}`}
                  autoComplete={esRegistro ? 'new-password' : 'current-password'}
                  placeholder={esRegistro ? `Mínimo ${MINIMO_CLAVE} caracteres` : 'Tu contraseña'}
                  value={clave}
                  aria-invalid={claveMal}
                  aria-describedby={claveMal ? 'ac-clave-error' : undefined}
                  onChange={(e) => setClave(e.target.value)}
                  onBlur={() => setTocado(true)}
                />
                <button
                  type="button"
                  onClick={() => setVerClave(!verClave)}
                  aria-pressed={verClave}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--color-ad-acento-claro)]"
                >
                  {verClave ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              {claveMal && (
                <p id="ac-clave-error" className="mt-2 text-xs text-[var(--color-trampa)]">
                  Usa al menos {MINIMO_CLAVE} caracteres.
                </p>
              )}
            </div>
          </div>

          <p aria-live="polite" className="min-h-5 pt-4 text-sm text-[var(--color-trampa)]">
            {error}
          </p>

          <button
            type="submit"
            disabled={cargando}
            className="ad-boton ad-boton--primario w-full"
          >
            {cargando ? 'Un momento…' : esRegistro ? 'Crear cuenta' : 'Entrar'}
          </button>
        </div>

        {/* Aviso honesto del estado del proyecto: no afirmamos lo que no hay. */}
        <p className="mt-5 flex items-start gap-2.5 text-xs leading-relaxed text-[var(--color-ad-texto-tenue)]">
          <FlaskConical
            className="mt-px h-3.5 w-3.5 flex-none text-[var(--color-ad-acento-claro)]"
            aria-hidden="true"
          />
          Versión de demostración del hackathon: la cuenta se crea solo en este navegador y se
          borra al recargar. Todavía no hay servidor detrás.
        </p>
      </form>
    </MarcoAdulto>
  );
}
