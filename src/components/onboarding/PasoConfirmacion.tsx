/**
 * Paso intermedio: confirmar la cuenta con el codigo que Cognito envio al
 * correo del adulto. Aparece solo cuando el User Pool pide confirmacion.
 *
 * No hay atajos: sin este codigo la cuenta no existe para el API. El codigo se
 * usa una vez y no se guarda.
 */

import { useState } from 'react';
import { MailCheck, RefreshCw, ShieldCheck } from 'lucide-react';
import { MarcoAdulto } from './MarcoAdulto';
import { PanelLateral } from './PanelLateral';

const LARGO_CODIGO = 6;

interface Props {
  correo: string;
  cargando: boolean;
  error: string | null;
  aviso: string | null;
  onConfirmar: (codigo: string) => void;
  onReenviar: () => void;
  onVolver: () => void;
}

export function PasoConfirmacion({
  correo,
  cargando,
  error,
  aviso,
  onConfirmar,
  onReenviar,
  onVolver,
}: Props) {
  const [codigo, setCodigo] = useState('');
  const listo = codigo.length === LARGO_CODIGO;

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!listo || cargando) return;
    onConfirmar(codigo);
    setCodigo('');
  }

  return (
    <MarcoAdulto
      pasoActual={1}
      kicker="Paso 2 de 4"
      titulo="Confirma tu correo."
      descripcion={
        <>
          Enviamos un código de {LARGO_CODIGO} dígitos a{' '}
          <strong className="text-[var(--color-ad-texto)]">{correo}</strong>. Escríbelo para activar
          la cuenta.
        </>
      }
      onVolver={onVolver}
      lateral={
        <PanelLateral
          kicker="Por qué este paso"
          items={[
            {
              icono: MailCheck,
              titulo: 'Confirma que el correo es tuyo',
              texto: 'Así la cuenta que administra los permisos queda en manos de un adulto real.',
            },
            {
              icono: ShieldCheck,
              titulo: 'Sin el código no hay cuenta',
              texto: 'Hasta confirmar, el servidor no acepta la sesión ni crea perfiles.',
            },
          ]}
        />
      }
    >
      <form onSubmit={enviar} noValidate>
        <div className="ad-tarjeta p-6 sm:p-7">
          <label htmlFor="cf-codigo" className="mb-2 block text-xs text-[var(--color-ad-texto-tenue)]">
            Código de confirmación
          </label>
          <input
            id="cf-codigo"
            className="ad-campo text-center text-lg tracking-[0.5em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={LARGO_CODIGO}
            placeholder="000000"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
          />

          <p aria-live="polite" className="min-h-5 pt-4 text-sm">
            {error ? (
              <span className="text-[var(--color-trampa)]">{error}</span>
            ) : (
              <span className="text-[var(--color-ad-texto-suave)]">{aviso}</span>
            )}
          </p>

          <button type="submit" disabled={!listo || cargando} className="ad-boton ad-boton--primario w-full">
            {cargando ? 'Un momento…' : 'Confirmar cuenta'}
          </button>

          <button
            type="button"
            onClick={onReenviar}
            className="mt-3 flex w-full items-center justify-center gap-2 text-xs font-semibold text-[var(--color-ad-acento-claro)]"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Enviarme otro código
          </button>
        </div>
      </form>
    </MarcoAdulto>
  );
}
