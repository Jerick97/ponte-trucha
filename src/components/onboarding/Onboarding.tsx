/**
 * Orquestador del onboarding: traduce el paso del store al componente que toca.
 * Es el unico de la carpeta que conoce `useSesion`; los pasos son
 * presentacionales y reciben todo por props.
 *
 * Las operaciones remotas (Cognito, cuenta, consentimiento y perfil) las hace
 * el store; aqui solo se encadena "crear perfil" con "empezar a jugar" para no
 * entrar al telefono si el servidor rechazo el perfil.
 */

import { useEffect } from 'react';
import { useSesion } from '../../store/sesion';
import type { SeleccionPerfil } from '../../onboarding/perfilInfantil';
import { Landing } from './Landing';
import { PasoAgeGate } from './PasoAgeGate';
import { PasoAcceso, type ModoAcceso } from './PasoAcceso';
import { PasoConfirmacion } from './PasoConfirmacion';
import { PasoConsentimiento } from './PasoConsentimiento';
import { PasoPerfiles } from './PasoPerfiles';
import { PasoPerfil } from './PasoPerfil';

export function Onboarding() {
  const paso = useSesion((s) => s.paso);
  const consentimiento = useSesion((s) => s.consentimiento);
  const estadoAcceso = useSesion((s) => s.estadoAcceso);
  const errorAcceso = useSesion((s) => s.errorAcceso);
  const avisoAcceso = useSesion((s) => s.avisoAcceso);
  const correoPorConfirmar = useSesion((s) => s.correoPorConfirmar);
  const estadoConsentimiento = useSesion((s) => s.estadoConsentimiento);
  const errorConsentimiento = useSesion((s) => s.errorConsentimiento);
  const estadoPerfil = useSesion((s) => s.estadoPerfil);
  const errorPerfil = useSesion((s) => s.errorPerfil);
  const perfiles = useSesion((s) => s.perfiles);
  const restaurando = useSesion((s) => s.restaurando);

  const irAAgeGate = useSesion((s) => s.irAAgeGate);
  const aprobarAgeGate = useSesion((s) => s.aprobarAgeGate);
  const registrar = useSesion((s) => s.registrar);
  const acceder = useSesion((s) => s.acceder);
  const confirmarCuenta = useSesion((s) => s.confirmarCuenta);
  const reenviarCodigo = useSesion((s) => s.reenviarCodigo);
  const decidirFinalidad = useSesion((s) => s.decidirFinalidad);
  const confirmarConsentimiento = useSesion((s) => s.confirmarConsentimiento);
  const crearPerfil = useSesion((s) => s.crearPerfil);
  const irACrearPerfil = useSesion((s) => s.irACrearPerfil);
  const elegirPerfil = useSesion((s) => s.elegirPerfil);
  const empezarAJugar = useSesion((s) => s.empezarAJugar);
  const volver = useSesion((s) => s.volver);

  // Cada paso arranca desde arriba: sin esto, quien llega desde el final de
  // la landing (o vuelve atras) aterriza a mitad de pantalla.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [paso]);

  function acceso(modo: ModoAcceso, correo: string, clave: string) {
    void (modo === 'registro' ? registrar(correo, clave) : acceder(correo, clave));
  }

  async function crearYJugar(seleccion: SeleccionPerfil) {
    await crearPerfil(seleccion);
    empezarAJugar();
  }

  function elegirYJugar(childId: string) {
    elegirPerfil(childId);
    empezarAJugar();
  }

  // Mientras se reanuda una sesion guardada no se muestra la landing: seria un
  // parpadeo que invita a empezar de nuevo lo que ya estaba empezado.
  if (restaurando) {
    return (
      <div className="ad-escena grid min-h-dvh place-items-center">
        <p aria-live="polite" className="text-sm text-[var(--color-ad-texto-suave)]">
          Retomando tu sesión…
        </p>
      </div>
    );
  }

  switch (paso) {
    case 'landing':
      return <Landing onEmpezar={irAAgeGate} />;

    case 'ageGate':
      return <PasoAgeGate onAprobado={aprobarAgeGate} onVolver={volver} />;

    case 'acceso':
      return (
        <PasoAcceso
          cargando={estadoAcceso === 'loading'}
          error={errorAcceso}
          aviso={avisoAcceso}
          onEnviar={acceso}
          onVolver={volver}
        />
      );

    case 'confirmacion':
      return (
        <PasoConfirmacion
          correo={correoPorConfirmar ?? ''}
          cargando={estadoAcceso === 'loading'}
          error={errorAcceso}
          aviso={avisoAcceso}
          onConfirmar={(codigo) => void confirmarCuenta(codigo)}
          onReenviar={() => void reenviarCodigo()}
          onVolver={volver}
        />
      );

    case 'consentimiento':
      return (
        <PasoConsentimiento
          consentimiento={consentimiento}
          guardando={estadoConsentimiento === 'loading'}
          error={errorConsentimiento}
          onDecidir={decidirFinalidad}
          onConfirmar={() => void confirmarConsentimiento()}
          onVolver={volver}
        />
      );

    case 'perfiles':
      return (
        <PasoPerfiles
          perfiles={perfiles}
          onElegir={elegirYJugar}
          onCrear={irACrearPerfil}
          onVolver={volver}
        />
      );

    case 'perfil':
      return (
        <PasoPerfil
          creando={estadoPerfil === 'loading'}
          error={errorPerfil}
          onCrear={(seleccion) => void crearYJugar(seleccion)}
          onVolver={volver}
        />
      );

    default:
      return null;
  }
}
