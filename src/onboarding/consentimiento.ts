/**
 * Consentimiento parental versionado por finalidad.
 *
 * Reglas que aplica (R3 de la spec, `seguridad-infantil.md`):
 * - tres finalidades separadas, nunca un "acepto todo";
 * - negar por defecto, incluida `core`: la decision es del adulto;
 * - cada decision guarda version de politica, estado y timestamp;
 * - subir la version invalida el permiso hasta una decision nueva;
 * - revocar detiene el uso y deja rastro de cuando.
 *
 * Logica pura: no toca React, storage ni red.
 */

/** Version del aviso de privacidad. Subirla exige volver a preguntar. */
export const VERSION_POLITICA = 'politica-2026-07-v1';

export type ClaveFinalidad = 'core' | 'serverSideAi' | 'productAnalytics';

export type EstadoConsentimiento = 'otorgado' | 'denegado' | 'revocado';

export interface DecisionConsentimiento {
  estado: EstadoConsentimiento;
  versionPolitica: string;
  decididoEn?: string;
  revocadoEn?: string;
}

export type MapaConsentimiento = Record<ClaveFinalidad, DecisionConsentimiento>;

export interface Finalidad {
  clave: ClaveFinalidad;
  titulo: string;
  /** Que dato concreto se usa. Sin eufemismos. */
  queSeUsa: string;
  /** Para que sirve, en una frase. */
  paraQue: string;
  /** Como se retira el permiso despues. */
  comoRetirar: string;
  /** `false` solo para `core`: sin ella no hay cuenta ni progreso. */
  opcional: boolean;
}

/**
 * Catalogo de finalidades. El texto habla al adulto: claro, directo y sin
 * infantilizar (`tono-infantil.md`, seccion "Tono para adultos").
 */
export const FINALIDADES: readonly Finalidad[] = [
  {
    clave: 'core',
    titulo: 'Cuenta y progreso',
    queSeUsa: 'Tu correo, y del perfil de tu hijo o hija solo un apodo elegido de una lista, un avatar y su rango de edad.',
    paraQue: 'Crear la cuenta, guardar en qué nivel va y que pueda seguir donde dejó.',
    comoRetirar: 'Borrando la cuenta desde el área de padres. Se elimina todo el progreso.',
    opcional: false,
  },
  {
    clave: 'serverSideAi',
    titulo: 'Conversación con IA en la nube',
    queSeUsa: 'El texto que tu hijo o hija escribe al personaje, sin ningún dato que lo identifique.',
    paraQue: 'Que el personaje responda cuando el modelo del dispositivo no alcanza. Se procesa sin guardarse.',
    comoRetirar: 'Apagando esta opción cuando quieras. El juego sigue funcionando con respuestas ya preparadas.',
    opcional: true,
  },
  {
    clave: 'productAnalytics',
    titulo: 'Estadísticas de uso',
    queSeUsa: 'Qué tipo de mensaje se acertó o falló, con un identificador al azar. Nunca el texto ni quién es.',
    paraQue: 'Entender qué trampas cuestan más y mejorar el juego.',
    comoRetirar: 'Apagando esta opción. Se borra el identificador y no se envía nada más.',
    opcional: true,
  },
] as const;

const NECESARIAS: ReadonlySet<ClaveFinalidad> = new Set<ClaveFinalidad>(['core']);

/** `true` si la finalidad puede quedar apagada y el juego aun funciona. */
export function esOpcional(clave: ClaveFinalidad): boolean {
  return !NECESARIAS.has(clave);
}

/**
 * Estado de partida: todo denegado. No se pre-marca nada, ni siquiera `core`
 * (`tono-infantil.md`: "no marcar consentimientos opcionales por defecto").
 */
export function consentimientoInicial(): MapaConsentimiento {
  const vacio = (): DecisionConsentimiento => ({
    estado: 'denegado',
    versionPolitica: VERSION_POLITICA,
  });
  return { core: vacio(), serverSideAi: vacio(), productAnalytics: vacio() };
}

/** Registra la decision del adulto sobre una finalidad. */
export function decidir(
  actual: MapaConsentimiento,
  clave: ClaveFinalidad,
  otorga: boolean,
  ahora: string,
): MapaConsentimiento {
  return {
    ...actual,
    [clave]: {
      estado: otorga ? 'otorgado' : 'denegado',
      versionPolitica: VERSION_POLITICA,
      decididoEn: ahora,
      // Una decision nueva cierra cualquier revocacion anterior.
      revocadoEn: undefined,
    },
  };
}

/** Revoca una finalidad ya otorgada, dejando rastro de cuando. */
export function revocar(
  actual: MapaConsentimiento,
  clave: ClaveFinalidad,
  ahora: string,
): MapaConsentimiento {
  return {
    ...actual,
    [clave]: { ...actual[clave], estado: 'revocado', revocadoEn: ahora },
  };
}

/** `true` solo si esta otorgada Y en la version vigente de la politica. */
export function puedeUsar(actual: MapaConsentimiento, clave: ClaveFinalidad): boolean {
  const d = actual[clave];
  return d.estado === 'otorgado' && d.versionPolitica === VERSION_POLITICA;
}

/**
 * `true` si hay que volver a preguntar: nunca se decidio, se revoco, o la
 * decision quedo atada a una version anterior del aviso.
 */
export function faltaDecisionVigente(actual: MapaConsentimiento, clave: ClaveFinalidad): boolean {
  return !puedeUsar(actual, clave);
}
