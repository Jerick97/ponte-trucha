/**
 * Paso 2: cuenta del adulto (registro o inicio de sesion) contra Cognito.
 *
 * La contrasena vive en el estado local de este componente y se borra al
 * enviar: no entra al store, no se persiste y solo viaja a Cognito por HTTPS.
 * La validacion de aqui es de forma; la de verdad la hace el User Pool.
 */

import { useState } from 'react';
import { ShieldCheck, SlidersHorizontal, Trash2, Users } from 'lucide-react';
import { MarcoAdulto } from './MarcoAdulto';
import { PanelLateral } from './PanelLateral';

export type ModoAcceso = 'registro' | 'ingreso';

interface Props {
  /** Estado de la operacion remota: idle | loading | success | error. */
  cargando: boolean;
  error: string | null;
  /** Aviso neutro, por ejemplo tras confirmar la cuenta. */
  aviso: string | null;
  onEnviar: (modo: ModoAcceso, correo: string, clave: string) => void;
  onVolver: () => void;
}

/** Validacion mínima de forma; la de verdad la hará Cognito. */
function correoValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
}

/** Requisitos del User Pool (`infra/modules/identity`): 12 y cuatro familias. */
const MINIMO_CLAVE = 12;

function claveValida(valor: string): boolean {
  return (
    valor.length >= MINIMO_CLAVE &&
    /[a-z]/.test(valor) &&
    /[A-Z]/.test(valor) &&
    /\d/.test(valor) &&
    /[^A-Za-z0-9]/.test(valor)
  );
}

export function PasoAcceso({ cargando, error, aviso, onEnviar, onVolver }: Props) {
  const [modo, setModo] = useState<ModoAcceso>('registro');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [tocado, setTocado] = useState(false);

  const esRegistro = modo === 'registro';
  const correoMal = tocado && correo !== '' && !correoValido(correo);
  const claveMal = tocado && esRegistro && clave !== '' && !claveValida(clave);
  const listo = correoValido(correo) && (esRegistro ? claveValida(clave) : clave.length > 0);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setTocado(true);
    if (!listo || cargando) return;
    const enviada = clave;
    // La clave se descarta aqui mismo: solo el correo sigue en la sesion.
    setClave('');
    onEnviar(modo, correo.trim().toLowerCase(), enviada);
  }

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
                  aria-describedby={esRegistro ? 'ac-clave-ayuda' : undefined}
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
              {esRegistro && (
                <p
                  id="ac-clave-ayuda"
                  className={`mt-2 text-xs ${claveMal ? 'text-[var(--color-trampa)]' : 'text-[var(--color-ad-texto-tenue)]'}`}
                >
                  {MINIMO_CLAVE} caracteres o más, con mayúscula, minúscula, número y símbolo.
                </p>
              )}
            </div>
          </div>

          <p aria-live="polite" className="min-h-5 pt-4 text-sm">
            {error ? (
              <span className="text-[var(--color-trampa)]">{error}</span>
            ) : (
              <span className="text-[var(--color-ad-texto-suave)]">{aviso}</span>
            )}
          </p>

          <button type="submit" disabled={cargando} className="ad-boton ad-boton--primario w-full">
            {cargando ? 'Un momento…' : esRegistro ? 'Crear cuenta' : 'Entrar'}
          </button>
        </div>

        <p className="mt-5 flex items-start gap-2.5 text-xs leading-relaxed text-[var(--color-ad-texto-tenue)]">
          <ShieldCheck
            className="mt-px h-3.5 w-3.5 flex-none text-[var(--color-ad-acento-claro)]"
            aria-hidden="true"
          />
          La cuenta se crea en Amazon Cognito y la contraseña no pasa por nuestros servidores. La
          sesión vive solo en esta pestaña: al recargar hay que entrar otra vez.
        </p>
      </form>
    </MarcoAdulto>
  );
}
