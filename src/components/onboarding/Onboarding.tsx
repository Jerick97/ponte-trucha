/**
 * Orquestador del onboarding: traduce el paso del store al componente que toca.
 * Es el unico de la carpeta que conoce `useSesion`; los pasos son
 * presentacionales y reciben todo por props.
 */

import { useEffect, useRef } from 'react';
import { useSesion } from '../../store/sesion';
import type { SeleccionPerfil } from '../../onboarding/perfilInfantil';
import { Landing } from './Landing';
import { PasoAgeGate } from './PasoAgeGate';
import { PasoAcceso } from './PasoAcceso';
import { PasoConsentimiento } from './PasoConsentimiento';
import { PasoPerfil } from './PasoPerfil';

/** Latencia simulada del "login" para que el estado `loading` se vea. */
const MS_ACCESO_SIMULADO = 700;

export function Onboarding() {
  const paso = useSesion((s) => s.paso);
  const consentimiento = useSesion((s) => s.consentimiento);
  const estadoAcceso = useSesion((s) => s.estadoAcceso);
  const errorAcceso = useSesion((s) => s.errorAcceso);

  const irAAgeGate = useSesion((s) => s.irAAgeGate);
  const aprobarAgeGate = useSesion((s) => s.aprobarAgeGate);
  const empezarAcceso = useSesion((s) => s.empezarAcceso);
  const autenticar = useSesion((s) => s.autenticar);
  const decidirFinalidad = useSesion((s) => s.decidirFinalidad);
  const confirmarConsentimiento = useSesion((s) => s.confirmarConsentimiento);
  const crearPerfil = useSesion((s) => s.crearPerfil);
  const empezarAJugar = useSesion((s) => s.empezarAJugar);
  const volver = useSesion((s) => s.volver);

  // El timer del acceso simulado se limpia si el componente se desmonta antes.
  const temporizador = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (temporizador.current !== null) window.clearTimeout(temporizador.current);
    };
  }, []);

  // Cada paso arranca desde arriba: sin esto, quien llega desde el final de
  // la landing (o vuelve atras) aterriza a mitad de pantalla.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [paso]);

  /** MOCK: sustituir por la llamada real a Cognito (tarea 9 de la spec). */
  function accederSimulado(correo: string) {
    empezarAcceso();
    temporizador.current = window.setTimeout(() => {
      temporizador.current = null;
      autenticar(correo);
    }, MS_ACCESO_SIMULADO);
  }

  function crearYJugar(seleccion: SeleccionPerfil) {
    crearPerfil(seleccion);
    empezarAJugar();
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
          onEnviar={accederSimulado}
          onVolver={volver}
        />
      );

    case 'consentimiento':
      return (
        <PasoConsentimiento
          consentimiento={consentimiento}
          onDecidir={decidirFinalidad}
          onConfirmar={confirmarConsentimiento}
          onVolver={volver}
        />
      );

    case 'perfil':
      return <PasoPerfil onCrear={crearYJugar} onVolver={volver} />;

    default:
      return null;
  }
}
