/**
 * Modelo de datos del banco de escenarios.
 *
 * Este archivo es el contrato entre las tres areas del equipo:
 * - Contenido (Clau) escribe los escenarios en src/data/escenarios.json
 * - Logica (Francis) consume estos tipos en el motor y en el LLM
 * - UI (Jerick) renderiza a partir de estos tipos
 *
 * Si cambia una propiedad aqui, hay que actualizar tambien
 * src/data/escenarios.schema.json y scripts/validar-escenarios.mjs.
 */

/** Canal donde llega el mensaje: define el "skin" del telefono simulado. */
export type CanalMensaje = 'chat-juego' | 'whatsapp' | 'correo' | 'discord' | 'sms';

/** Familia de estafa. 'legitimo' significa que el mensaje es real y seguro. */
export type TipoEscenario =
  | 'monedas-gratis'
  | 'sorteo-falso'
  | 'robo-de-cuenta'
  | 'hack-con-virus'
  | 'link-tramposo'
  | 'suplantacion-de-amigo'
  | 'legitimo';

/** Lo que el nino responde: la unica decision del loop principal. */
export type Veredicto = 'trampa' | 'confianza';

/** Dificultad del escenario: se usa para ordenar la partida de menos a mas dificil. */
export type Dificultad = 1 | 2 | 3;

/** Una senal concreta que delata (o respalda) al mensaje. */
export interface SenalDelatora {
  /** Texto corto que se resalta en el mensaje, tal cual aparece en el cuerpo. */
  fragmento: string;
  /** Explicacion en lenguaje de nino de por que esa senal importa. */
  explicacion: string;
}

/** Remitente simulado del mensaje. */
export interface Remitente {
  nombre: string;
  /** Emoji o ruta de avatar dentro de public/avatares. */
  avatar: string;
  /** Marca visual de "cuenta verificada" falsa o real. */
  verificado: boolean;
}

/** Un escenario del banco curado. */
export interface Escenario {
  /** Identificador estable en kebab-case, unico en todo el banco. */
  id: string;
  tipo: TipoEscenario;
  canal: CanalMensaje;
  dificultad: Dificultad;
  remitente: Remitente;
  /** Cuerpo del mensaje que ve el nino. Maximo 240 caracteres. */
  mensaje: string;
  /**
   * Asunto del correo. Obligatorio cuando canal === 'correo' (lo exige el
   * validador); en los demas canales no se usa. La app Gmail lo muestra como
   * asunto del correo abierto en vez de derivarlo de la primera oracion.
   */
  asunto?: string;
  /** Respuesta correcta. Debe ser 'confianza' si y solo si tipo === 'legitimo'. */
  respuestaCorrecta: Veredicto;
  /** Senales que se resaltan en el feedback. Minimo 1. */
  senales: SenalDelatora[];
  /** La leccion en una frase, en lenguaje de nino. */
  leccion: string;
  /** Si es true, el nino puede seguir chateando con el estafador (LLM). */
  permiteConversacion: boolean;
  /**
   * Semilla de personalidad para el LLM cuando permiteConversacion es true.
   * Nunca describe acoso ni manipulacion personal: solo presion por la estafa.
   */
  perfilEstafador?: {
    /** Como se presenta: "admin del juego", "youtuber", "amigo del cole". */
    disfraz: string;
    /** Tacticas permitidas: prisa, premio, autoridad falsa, insistencia. */
    tacticas: string[];
    /** Lo que el estafador quiere conseguir (dato, click, pago). */
    objetivo: string;
  };
}

/** Estructura completa del archivo escenarios.json. */
export interface BancoEscenarios {
  version: string;
  escenarios: Escenario[];
}
