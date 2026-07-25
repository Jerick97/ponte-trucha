/**
 * Age gate del onboarding adulto: comprueba mayoria de edad SIN persistir la
 * fecha de nacimiento.
 *
 * Reglas que aplica (`.kiro/steering/seguridad-infantil.md`, R1 de la spec):
 * - la fecha se procesa en memoria y se descarta;
 * - al aprobar solo sobrevive `{ versionRegla, aprobadoEn }`;
 * - el rechazo NO explica la regla, para no ensenar a evadir el gate.
 *
 * Logica pura: no toca React, storage ni red.
 */

/** Mayoria de edad configurada (Peru). Cambiarla obliga a subir la version. */
export const EDAD_MINIMA_ADULTO = 18;

/** Version de la regla. Sube si cambia la edad minima o el calculo. */
export const VERSION_REGLA_AGE_GATE = 'age-gate-2026-07-v1';

/** Anio mas antiguo que consideramos plausible para una persona viva. */
const ANIO_MINIMO_PLAUSIBLE = 1900;

export interface FechaIngresada {
  dia: number;
  mes: number;
  anio: number;
}

/** Lo unico que queda en memoria tras aprobar el gate. */
export interface PruebaAgeGate {
  versionRegla: string;
  aprobadoEn: string;
}

export type ResultadoAgeGate =
  | { aprobado: true; prueba: PruebaAgeGate }
  | { aprobado: false; motivo: string };

/**
 * Motivo unico y deliberadamente vago: no menciona la edad requerida ni la
 * fecha ingresada. Un mensaje mas util aqui seria un mapa para evadir el gate.
 */
const MOTIVO_GENERICO = 'No podemos continuar con los datos ingresados.';

/** Comprueba que dia/mes/anio formen una fecha de calendario real y pasada. */
export function esFechaPlausible({ dia, mes, anio }: FechaIngresada): boolean {
  if (!Number.isInteger(dia) || !Number.isInteger(mes) || !Number.isInteger(anio)) return false;
  if (anio < ANIO_MINIMO_PLAUSIBLE) return false;
  if (mes < 1 || mes > 12) return false;
  if (dia < 1 || dia > 31) return false;

  // Construir en UTC y verificar que el navegador no haya "corregido" el dia
  // (asi cae un 31 de febrero o un 29/2 de anio no bisiesto).
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return (
    fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia
  );
}

/** Edad cumplida en anios entre dos fechas UTC. */
function edadCumplida(nacimiento: Date, hoy: Date): number {
  let edad = hoy.getUTCFullYear() - nacimiento.getUTCFullYear();
  const mesesAntes = hoy.getUTCMonth() < nacimiento.getUTCMonth();
  const mismoMesDiaAntes =
    hoy.getUTCMonth() === nacimiento.getUTCMonth() && hoy.getUTCDate() < nacimiento.getUTCDate();
  if (mesesAntes || mismoMesDiaAntes) edad -= 1;
  return edad;
}

/**
 * Evalua el gate. `hoy` se inyecta para que la funcion sea determinista y
 * testeable; en la UI se pasa `new Date()`.
 */
export function evaluarAgeGate(fecha: FechaIngresada, hoy: Date): ResultadoAgeGate {
  if (!esFechaPlausible(fecha)) return { aprobado: false, motivo: MOTIVO_GENERICO };

  const nacimiento = new Date(Date.UTC(fecha.anio, fecha.mes - 1, fecha.dia));
  if (nacimiento.getTime() > hoy.getTime()) return { aprobado: false, motivo: MOTIVO_GENERICO };

  if (edadCumplida(nacimiento, hoy) < EDAD_MINIMA_ADULTO) {
    return { aprobado: false, motivo: MOTIVO_GENERICO };
  }

  // A partir de aqui la fecha ya cumplio su unico proposito y se descarta:
  // solo devolvemos version de regla y momento de aprobacion.
  return {
    aprobado: true,
    prueba: { versionRegla: VERSION_REGLA_AGE_GATE, aprobadoEn: hoy.toISOString() },
  };
}
