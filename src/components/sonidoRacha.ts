/**
 * Sonidos del "feel" del juego, sintetizados con la Web Audio API: sin
 * archivos de audio. Incluye el combo de racha (sube de tono), el guino
 * suave cuando se rompe una racha, y la fanfarria de victoria al terminar.
 *
 * Son adorno de presentacion: no importan nada del juego. Silencioso si el
 * navegador no soporta AudioContext o bloquea el audio.
 */

import { estaSilenciado } from '../store/audio';

type TipoOnda = OscillatorType;

let ctx: AudioContext | null = null;

function contexto(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (estaSilenciado()) return null;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Toca una nota corta con envolvente tipo "blip". */
function tono(
  ac: AudioContext,
  frecuencia: number,
  inicio: number,
  duracion: number,
  tipo: TipoOnda,
  volumenPico: number,
): void {
  const osc = ac.createOscillator();
  const gan = ac.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(frecuencia, inicio);
  gan.gain.setValueAtTime(0, inicio);
  gan.gain.linearRampToValueAtTime(volumenPico, inicio + 0.01);
  gan.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
  osc.connect(gan).connect(ac.destination);
  osc.start(inicio);
  osc.stop(inicio + duracion + 0.02);
}

// Escala mayor pentatonica ascendente: suena alegre y "sube" con la racha.
const NOTAS = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];

/** Blip cuya altura depende de la racha (1 = grave, mas = agudo). */
export function reproducirSonidoRacha(racha: number): void {
  const ac = contexto();
  if (!ac) return;

  const paso = Math.max(0, Math.min(racha - 1, NOTAS.length - 1));
  const frecuencia = NOTAS[paso];
  const ahora = ac.currentTime;

  tono(ac, frecuencia, ahora, 0.28, racha >= 3 ? 'triangle' : 'sine', 0.18);
  // A partir de racha 4, una quinta encima para que suene mas intenso.
  if (racha >= 4) tono(ac, frecuencia * 1.5, ahora + 0.06, 0.26, 'triangle', 0.12);
}

/** Guino suave y descendente al romper una racha: "se apago el fueguito". */
export function reproducirSonidoRachaRota(): void {
  const ac = contexto();
  if (!ac) return;
  const ahora = ac.currentTime;
  // Dos notas bajando, volumen bajo: reconoce el tropiezo sin regañar.
  tono(ac, 392.0, ahora, 0.22, 'sine', 0.12);
  tono(ac, 293.66, ahora + 0.13, 0.3, 'sine', 0.12);
}

/** Fanfarria de victoria al terminar la partida: arpegio ascendente + acorde. */
export function reproducirFanfarria(): void {
  const ac = contexto();
  if (!ac) return;
  const ahora = ac.currentTime;

  // Arpegio Do-Mi-Sol-Do que sube.
  const arpegio = [523.25, 659.25, 783.99, 1046.5];
  arpegio.forEach((freq, i) => {
    tono(ac, freq, ahora + i * 0.12, 0.3, 'triangle', 0.16);
  });
  // Acorde final para rematar.
  const finl = ahora + arpegio.length * 0.12 + 0.02;
  for (const freq of [523.25, 659.25, 783.99, 1046.5]) {
    tono(ac, freq, finl, 0.6, 'triangle', 0.1);
  }
}
