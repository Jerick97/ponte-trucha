/**
 * Landing de presentacion. Le habla al PADRE, MADRE O TUTOR, no al nino:
 * claro, directo y sin infantilizar (`tono-infantil.md`, "Tono para adultos").
 *
 * Direccion visual: editorial oscuro con dos acentos (azul de marca, ambar de
 * alerta). La pieza central es un iPhone en CSS con la misma carcasa y
 * wallpaper del juego, recibiendo estafas en vivo: la landing ENSEÑA el
 * producto en lugar de describirlo.
 *
 * Presentacion pura: recibe `onEmpezar` y no conoce el store ni las reglas.
 */

import {
  ArrowRight,
  BadgeCheck,
  Check,
  Cpu,
  Flag,
  Gamepad2,
  Lightbulb,
  Mail,
  MessageCircle,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useEffect, useRef, type CSSProperties } from 'react';
import { orden } from './orden';
import capturaHome from '../../assets/img/landing/juego-home.jpg';
import capturaDecision from '../../assets/img/landing/juego-decision.jpg';
import marca from '../../assets/img/landing/marca.png';
import demoVideo from '../../assets/video/demo-landing.mp4';
import demoPoster from '../../assets/video/demo-poster.jpg';
import iconoWhatsapp from '../../assets/img/icon_whatsapp.png';
import iconoMensajes from '../../assets/img/Icon_message.svg';
import iconoDiscord from '../../assets/img/icono_discord.svg';
import iconoRoblox from '../../assets/img/icono_roblox.svg';
import iconoGmail from '../../assets/img/icon_gmail.svg';

/** Anzuelos reales que desfilan en la marquesina. Solo fraude: nada personal. */
const ANZUELOS = [
  'Ganaste 10 000 Robux',
  'Tu cuenta será suspendida hoy',
  'Mamá, se me malogró el cel, este es mi número nuevo',
  'Nitro gratis solo por hoy',
  'Tu paquete está retenido, paga S/ 2.50',
  'Última oportunidad para reclamar tu premio',
  'Verifica tu cuenta con tu clave',
];

/** Mismos iconos y baldosas que usa el home del telefono simulado (apps.ts). */
const APPS_SIMULADAS = [
  { nombre: 'WhatsApp', icono: iconoWhatsapp, conFondo: true, clase: 'bg-[var(--color-app-whatsapp)]' },
  { nombre: 'Mensajes', icono: iconoMensajes, conFondo: true, clase: 'bg-[var(--color-app-mensajes)]' },
  { nombre: 'Discord', icono: iconoDiscord, conFondo: false, clase: 'bg-[var(--color-app-discord)]' },
  { nombre: 'Roblox', icono: iconoRoblox, conFondo: false, clase: 'bg-[var(--color-rb-azul)]' },
  { nombre: 'Gmail', icono: iconoGmail, conFondo: false, clase: 'bg-[var(--color-telefono)]' },
];

const PRIVACIDAD = [
  'Su nombre real, su foto o su voz',
  'Su correo o su teléfono',
  'Su fecha de nacimiento',
  'Su ubicación',
  'Lo que escribe en el chat',
];

/**
 * Cifras REALES con fuente verificable. No se inventa ni se redondea hacia
 * arriba: si una fuente cambia, se actualiza el numero o se quita la tarjeta.
 */
const EVIDENCIA = [
  {
    cifra: '6,6 M',
    texto: 'de intentos de ataque a jugadores jóvenes se detectaron en un solo año.',
    fuente: 'Kaspersky, 2024',
    url: 'https://www.kaspersky.es/about/press-releases/los-ciberataques-a-jovenes-gamers-aumentaron-un-30-en-la-primera-mitad-de-2024',
  },
  {
    cifra: '+30 %',
    texto: 'creció el número de menores atacados en la primera mitad de 2024.',
    fuente: 'Kaspersky, 2024',
    url: 'https://www.kaspersky.es/about/press-releases/los-ciberataques-a-jovenes-gamers-aumentaron-un-30-en-la-primera-mitad-de-2024',
  },
  {
    cifra: '1 de 3',
    texto: 'usuarios de internet en el mundo es un niño o una niña.',
    fuente: 'UNICEF',
    url: 'https://www.unicef.org/peru/comunicados-prensa/unicef-pide-proteger-los-ninos-en-el-mundo-digital-al-tiempo-que-se-mejora-el',
  },
];

/**
 * Hoja de ruta visible: sale de los specs reales de `.kiro/specs/` (banco de
 * escenarios, backend serverless, area de padres). Nada que no este planeado.
 */
const HOJA_DE_RUTA = [
  {
    estado: 'En camino',
    titulo: 'Más escenarios cada semana',
    texto: 'El banco de trampas crece con lo que circula de verdad: nuevos premios falsos, nuevos apuros, nuevas señales que aprender.',
  },
  {
    estado: 'En camino',
    titulo: 'Progreso guardado en la nube',
    texto: 'Cuentas reales para seguir la partida desde cualquier dispositivo — con la misma regla de siempre: cero datos del niño.',
  },
  {
    estado: 'Próximamente',
    titulo: 'Área de padres',
    texto: 'Ver el avance de tu hijo o hija, ajustar cada permiso y borrar todo, desde un solo lugar.',
  },
  {
    estado: 'Próximamente',
    titulo: 'Nuevas apps simuladas',
    texto: 'Las trampas cambian de app todo el tiempo. El teléfono del juego también va a crecer.',
  },
] as const;

/** Garantías que un padre quiere leer ANTES de dar clic. */
const CONFIANZA = [
  { icono: Cpu, texto: 'Corre en el dispositivo' },
  { icono: BadgeCheck, texto: 'Sin anuncios ni compras' },
  { icono: ShieldCheck, texto: 'Sin contacto con extraños' },
  { icono: SlidersHorizontal, texto: 'Tú lo controlas todo' },
];

/** Capturas REALES del juego, tomadas del build actual: prueba, no promesa. */
const CAPTURAS = [
  {
    src: capturaHome,
    ancho: 420,
    alto: 944,
    titulo: 'Le llega al teléfono',
    detalle: 'Notificaciones como las de verdad, con puntaje y racha arriba.',
    alt: 'Home del teléfono simulado con una notificación de Gmail llegando y el marcador del juego',
  },
  {
    src: capturaDecision,
    ancho: 388,
    alto: 920,
    titulo: 'Y decide',
    detalle: 'No todo es estafa: también aprende a reconocer lo que sí es de fiar.',
    alt: 'Correo abierto en el juego con los botones Es trampa y De confianza',
  },
];

interface Props {
  onEmpezar: () => void;
}

/* ------------------------------------------------------------------------- */

/** Capa del parallax: posicion en la secuencia de entrada + profundidad. */
function capa(i: number, prof: number): CSSProperties {
  return { ...orden(i), '--prof': prof } as CSSProperties;
}

/**
 * iPhone en CSS con la pantalla de bloqueo del juego recibiendo estafas.
 *
 * Parallax estilo poster de Apple TV, adaptado: el mouse inclina el telefono
 * hacia el cursor, un brillo recorre el vidrio y cada notificacion flota a su
 * propia profundidad (`--prof`). Todo via variables CSS actualizadas en un
 * requestAnimationFrame; con `prefers-reduced-motion` no se activa.
 */
function TelefonoDemo() {
  const escenarioRef = useRef<HTMLDivElement>(null);
  const marcoRaf = useRef<number | null>(null);
  const puntero = useRef({ x: 0, y: 0 });

  useEffect(() => {
    return () => {
      if (marcoRaf.current !== null) cancelAnimationFrame(marcoRaf.current);
    };
  }, []);

  function pintarParallax() {
    marcoRaf.current = null;
    const el = escenarioRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const { x, y } = puntero.current;
    // Offsets en [-0.5, 0.5] respecto al centro de la escena.
    const ox = 0.5 - (x - r.left) / r.width;
    const oy = 0.5 - (y - r.top) / r.height;
    // Angulo cursor→centro para orientar el brillo del vidrio.
    const dx = x - (r.left + r.width / 2);
    const dy = y - (r.top + r.height / 2);
    let angulo = (Math.atan2(dy, dx) * 180) / Math.PI - 90;
    if (angulo < 0) angulo += 360;

    el.style.setProperty('--ad-ox', ox.toFixed(3));
    el.style.setProperty('--ad-oy', oy.toFixed(3));
    el.style.setProperty('--ad-ry', `${(ox * -22).toFixed(2)}deg`);
    el.style.setProperty('--ad-rx', `${(oy * 14).toFixed(2)}deg`);
    el.style.setProperty('--ad-angulo', `${angulo.toFixed(1)}deg`);
    el.style.setProperty('--ad-brillo', (0.06 + (0.5 - oy) * 0.18).toFixed(3));
  }

  function alMover(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    puntero.current = { x: e.clientX, y: e.clientY };
    if (marcoRaf.current === null) marcoRaf.current = requestAnimationFrame(pintarParallax);
  }

  function alSalir() {
    const el = escenarioRef.current;
    if (!el) return;
    // Al soltar las variables, el CSS transiciona solo de vuelta al reposo.
    for (const v of ['--ad-ox', '--ad-oy', '--ad-ry', '--ad-rx', '--ad-angulo', '--ad-brillo']) {
      el.style.removeProperty(v);
    }
  }

  return (
    <div
      ref={escenarioRef}
      onPointerMove={alMover}
      onPointerLeave={alSalir}
      className="ad-fono-escenario relative flex justify-center"
      role="img"
      aria-label="Teléfono simulado del juego mostrando tres mensajes de estafa llegando a la pantalla de bloqueo"
    >
      <div className="ad-halo" />
      <div className="ad-fono-flotante relative">
        <div className="ad-fono" aria-hidden="true">
          <div className="ad-fono-pantalla flex flex-col px-3 pb-4 pt-2">
            <div className="ad-fono-notch" />
            <div className="ad-fono-brillo" aria-hidden="true" />

            {/* Hora del lock, como en el juego (capa lejana: va al reves) */}
            <div className="ad-fono-capa mt-10 text-center" style={{ '--prof': -8 } as CSSProperties}>
              <p className="text-[11px] font-medium text-white/80">viernes 24 de julio</p>
              <p className="text-[3.4rem] font-bold leading-none tracking-tight">9:41</p>
            </div>

            {/* Notificaciones cayendo en cascada */}
            <div className="mt-5 flex flex-col gap-2">
              <div className="ad-fono-capa ad-fono-notif ad-fono-entra p-2.5" style={capa(0, 10)}>
                <div className="flex items-start gap-2">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-[var(--color-app-chat-juego)]">
                    <Gamepad2 className="h-4 w-4 text-white" />
                  </span>
                  <div className="min-w-0 text-[11px] leading-snug">
                    <p className="flex items-baseline justify-between gap-2 font-semibold">
                      RobloxPremios_Oficial
                      <span className="flex-none text-[9px] font-normal text-white/60">ahora</span>
                    </p>
                    <p className="text-white/85">
                      ¡GANASTE <mark className="ad-senal" style={orden(0)}>10 000 Robux</mark>! Entra
                      a <mark className="ad-senal" style={orden(1)}>robux-premio.link</mark> y pon{' '}
                      <mark className="ad-senal" style={orden(2)}>tu clave</mark> 🎁
                    </p>
                  </div>
                </div>
              </div>

              <div className="ad-fono-capa ad-fono-notif ad-fono-entra p-2.5" style={capa(1, 15)}>
                <div className="flex items-start gap-2">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-[var(--color-app-whatsapp)]">
                    <MessageCircle className="h-4 w-4 text-white" />
                  </span>
                  <div className="min-w-0 text-[11px] leading-snug">
                    <p className="flex items-baseline justify-between gap-2 font-semibold">
                      Número desconocido
                      <span className="flex-none text-[9px] font-normal text-white/60">ahora</span>
                    </p>
                    <p className="text-white/85">
                      Hola hijito 🙏 se me malogró el cel, escríbeme a este número nuevo…
                    </p>
                  </div>
                </div>
              </div>

              <div className="ad-fono-capa ad-fono-notif ad-fono-entra p-2.5" style={capa(2, 20)}>
                <div className="flex items-start gap-2">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-[var(--color-app-gmail)]">
                    <Mail className="h-4 w-4 text-white" />
                  </span>
                  <div className="min-w-0 text-[11px] leading-snug">
                    <p className="flex items-baseline justify-between gap-2 font-semibold">
                      Soporte-Cuentas
                      <span className="flex-none text-[9px] font-normal text-white/60">hace 2 min</span>
                    </p>
                    <p className="text-white/85">Tu cuenta será suspendida hoy. Verifica aquí →</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie del lock */}
            <div
              className="ad-fono-capa mt-auto flex flex-col items-center gap-2 pt-4"
              style={{ '--prof': 6 } as CSSProperties}
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/55">
                Aquí es donde practica
              </p>
              <span className="h-1 w-24 rounded-full bg-white/70" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */

export function Landing({ onEmpezar }: Props) {
  return (
    <div className="ad-contenido pb-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        {/* --- Barra superior -------------------------------------------- */}
        <header className="ad-revela flex items-center justify-between pt-8" style={orden(0)}>
          <div className="flex items-center gap-3.5">
            <img
              src={marca}
              alt=""
              aria-hidden="true"
              width={160}
              height={160}
              className="h-12 w-12 drop-shadow-[0_6px_14px_rgb(47_107_255/0.55)]"
            />
            <span className="text-xl font-extrabold tracking-tight">
              Ponte Trucha <span className="text-[var(--color-ad-acento-claro)]">Kids</span>
            </span>
          </div>
          <div className="flex items-center gap-5">
            <p className="hidden text-sm text-[var(--color-ad-texto-tenue)] md:block">
              Para madres, padres y tutores
            </p>
            <button
              type="button"
              onClick={onEmpezar}
              className="rounded-full border border-[rgb(123_163_255/0.45)] bg-[rgb(47_107_255/0.14)] px-5 py-2.5 text-sm font-bold text-[var(--color-ad-texto)] transition-all hover:border-[var(--color-ad-acento-claro)] hover:bg-[rgb(47_107_255/0.28)]"
            >
              Ya tengo cuenta
            </button>
          </div>
        </header>

        {/* --- Hero ------------------------------------------------------- */}
        <div className="mt-16 grid items-center gap-14 lg:mt-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
          <div>
            <p className="ad-revela ad-kicker flex items-center gap-2.5" style={orden(1)}>
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-[var(--color-nivel-despierto)]"
              />
              El simulador de estafas para niños
            </p>

            <h1
              className="ad-display ad-revela mt-6 text-[3rem] sm:text-[3.9rem] lg:text-[4.3rem]"
              style={orden(2)}
            >
              A tu hijo ya
              <br />
              le llegan{' '}
              <em className="not-italic text-[var(--color-ad-acento-claro)]">
                estos
                <br />
                mensajes.
              </em>
            </h1>

            <p
              className="ad-revela mt-7 max-w-[32rem] text-[1.0625rem] leading-relaxed text-[var(--color-ad-texto-suave)]"
              style={orden(3)}
            >
              Un teléfono simulado donde practica reconocerlos antes de encontrarlos en serio.
              Equivocarse acá no cuesta nada — y es justo ahí donde aprende.
            </p>

            <div className="ad-revela mt-9 flex flex-wrap items-center gap-4" style={orden(4)}>
              <button type="button" onClick={onEmpezar} className="ad-boton ad-boton--primario">
                Crear una cuenta
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <a href="#como-funciona" className="ad-boton ad-boton--fantasma no-underline">
                Ver cómo funciona
              </a>
            </div>

            {/* Garantías de un vistazo, justo donde se decide el clic. */}
            <ul className="ad-revela mt-7 grid max-w-[30rem] grid-cols-2 gap-x-6 gap-y-2.5" style={orden(5)}>
              {CONFIANZA.map((c) => (
                <li
                  key={c.texto}
                  className="flex items-center gap-2 text-[0.8125rem] text-[var(--color-ad-texto-suave)]"
                >
                  <c.icono
                    className="h-4 w-4 flex-none text-[var(--color-ad-acento-claro)]"
                    aria-hidden="true"
                  />
                  {c.texto}
                </li>
              ))}
            </ul>

            <dl
              className="ad-revela mt-10 grid max-w-[30rem] grid-cols-3 gap-6 border-t border-[var(--color-ad-borde)] pt-7"
              style={orden(6)}
            >
              {[
                { n: '8–13', t: 'años, en dos bandas de edad' },
                { n: '5', t: 'apps simuladas idénticas a las reales' },
                { n: '0', t: 'datos personales del niño', acento: true },
              ].map((d) => (
                <div key={d.t}>
                  <dt
                    className={`ad-display text-[2.1rem] ${
                      d.acento ? 'text-[var(--color-nivel-despierto)]' : 'text-[var(--color-ad-texto)]'
                    }`}
                  >
                    {d.n}
                  </dt>
                  <dd className="mt-1.5 text-xs leading-snug text-[var(--color-ad-texto-tenue)]">
                    {d.t}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="ad-revela" style={orden(4)}>
            <TelefonoDemo />
          </div>
        </div>
      </div>

      {/* --- Marquesina de anzuelos (full-bleed) -------------------------- */}
      <div className="mt-24" aria-hidden="true">
        <div className="ad-marquesina">
          <div className="ad-marquesina-pista">
            {[0, 1].map((copia) => (
              <span key={copia} className="flex">
                {ANZUELOS.map((frase) => (
                  <span key={frase} className="ad-anzuelo">
                    {frase}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
        <p className="mx-auto mt-3 max-w-6xl px-6 text-right text-[0.6875rem] text-[var(--color-ad-texto-tenue)] sm:px-10">
          Anzuelos reales que circulan cada semana. Todos están en el juego.
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        {/* --- El problema es real: cifras con fuente --------------------- */}
        <section className="ad-vista mt-20 grid gap-8 sm:grid-cols-3 sm:gap-6" aria-label="El problema en cifras">
          {EVIDENCIA.map((e) => (
            <div key={e.cifra + e.fuente} className="border-l-2 border-[var(--color-nivel-despierto)] pl-5">
              <p className="ad-display text-[2.3rem] text-[var(--color-ad-texto)]">{e.cifra}</p>
              <p className="mt-1.5 text-sm leading-snug text-[var(--color-ad-texto-suave)]">{e.texto}</p>
              <a
                href={e.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 inline-block text-xs text-[var(--color-ad-texto-tenue)] underline decoration-[var(--color-ad-borde)] underline-offset-4 transition-colors hover:text-[var(--color-ad-acento-claro)]"
              >
                Fuente: {e.fuente}
              </a>
            </div>
          ))}
        </section>

        {/* --- Cómo funciona --------------------------------------------- */}
        <section id="como-funciona" className="mt-28 scroll-mt-10">
          <p className="ad-kicker">Cómo funciona</p>
          <div className="ad-filete mt-4" />

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {/* Paso 1: llega el mensaje */}
            <article className="ad-tarjeta ad-carta ad-vista p-6">
              <p className="ad-numero">01</p>
              <h3 className="ad-display mt-2 text-[1.375rem]">Le llega un mensaje</h3>
              <p className="mt-3 min-h-16 text-sm leading-relaxed text-[var(--color-ad-texto-suave)]">
                En WhatsApp, Roblox, Discord, SMS o correo. Escritos como los de verdad, no como
                un ejercicio de clase.
              </p>
              <div className="mt-5 rounded-xl border border-[var(--color-ad-borde)] bg-[rgb(8_11_26/0.6)] p-3">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[var(--color-app-gmail)]">
                    <Mail className="h-4 w-4 text-white" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 text-xs leading-snug">
                    <p className="font-semibold text-[var(--color-ad-texto)]">Soporte-Cuentas</p>
                    <p className="truncate text-[var(--color-ad-texto-suave)]">
                      Tu cuenta será suspendida hoy…
                    </p>
                  </div>
                </div>
              </div>
            </article>

            {/* Paso 2: decide */}
            <article className="ad-tarjeta ad-carta ad-vista p-6">
              <p className="ad-numero">02</p>
              <h3 className="ad-display mt-2 text-[1.375rem]">Decide: ¿trampa o confianza?</h3>
              <p className="mt-3 min-h-16 text-sm leading-relaxed text-[var(--color-ad-texto-suave)]">
                Puede responderle al estafador y ver hasta dónde llega. El personaje corre en el
                propio dispositivo.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <span className="flex items-center justify-center gap-1.5 rounded-full border border-[rgb(229_72_77/0.5)] bg-[rgb(229_72_77/0.12)] py-2.5 text-xs font-bold text-[#ff8d91]">
                  <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                  Trampa
                </span>
                <span className="flex items-center justify-center gap-1.5 rounded-full border border-[rgb(47_168_79/0.5)] bg-[rgb(47_168_79/0.12)] py-2.5 text-xs font-bold text-[#6fd88b]">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  Confianza
                </span>
              </div>
            </article>

            {/* Paso 3: la pista */}
            <article className="ad-tarjeta ad-carta ad-vista p-6">
              <p className="ad-numero">03</p>
              <h3 className="ad-display mt-2 text-[1.375rem]">Descubre la pista que se le pasó</h3>
              <p className="mt-3 min-h-16 text-sm leading-relaxed text-[var(--color-ad-texto-suave)]">
                Sin regaños. Se le señala la parte exacta del mensaje y la regla que le sirve
                para la próxima.
              </p>
              <div className="mt-5 rounded-xl border border-[var(--color-ad-borde)] bg-[rgb(8_11_26/0.6)] p-3 text-xs leading-relaxed">
                <p className="text-[var(--color-ad-texto-suave)]">
                  …y pon{' '}
                  <span className="rounded bg-[rgb(245_165_36/0.22)] px-1 text-[#ffd894] shadow-[0_1px_0_var(--color-nivel-despierto)]">
                    tu clave
                  </span>{' '}
                  para reclamar 🎁
                </p>
                <p className="mt-2.5 flex items-start gap-1.5 text-[var(--color-nivel-despierto)]">
                  <Lightbulb className="mt-px h-3.5 w-3.5 flex-none" aria-hidden="true" />
                  Nadie que sea de verdad te pide tu clave.
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* --- Así se ve por dentro: capturas reales del juego ------------ */}
        <section className="mt-28">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="ad-kicker">Así se ve por dentro</p>
              <div className="ad-filete mt-4" />
              <h2 className="ad-display mt-6 text-[1.9rem] sm:text-[2.2rem]">
                Grabado del juego real. Sin maquetas.
              </h2>
            </div>
            <p className="max-w-[22rem] text-sm leading-relaxed text-[var(--color-ad-texto-suave)]">
              Al centro, una partida de verdad: dos mensajes, dos decisiones y su celebración.
              Tal cual se ve al jugar.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl gap-12 sm:grid-cols-3 sm:gap-10">
            {/* Captura izquierda */}
            <figure className="ad-vista mx-auto w-full max-w-[240px] sm:max-w-none">
              <div className="ad-captura">
                <img
                  src={CAPTURAS[0].src}
                  alt={CAPTURAS[0].alt}
                  width={CAPTURAS[0].ancho}
                  height={CAPTURAS[0].alto}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <figcaption className="mt-4 px-1">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <span className="ad-numero">01</span>
                  {CAPTURAS[0].titulo}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-ad-texto-tenue)]">
                  {CAPTURAS[0].detalle}
                </p>
              </figcaption>
            </figure>

            {/* Video central: la partida real en bucle. Con reduced-motion el
                CSS oculta el video y muestra el poster estatico (.ad-captura-poster). */}
            <figure className="ad-vista mx-auto w-full max-w-[240px] sm:max-w-none">
              <div className="ad-captura ad-captura--destacada">
                <video
                  src={demoVideo}
                  poster={demoPoster}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  width={480}
                  height={1238}
                  aria-label="Grabación de una partida real: llegan dos mensajes, el jugador decide si son trampa o de confianza y celebra sus aciertos"
                />
                <img
                  src={demoPoster}
                  alt="Pantalla de bloqueo del juego con una notificación entrante"
                  width={480}
                  height={1238}
                  loading="lazy"
                  decoding="async"
                  className="ad-captura-poster"
                />
              </div>
              <figcaption className="mt-4 px-1">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <span className="ad-numero">02</span>
                  Una partida real, en vivo
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-ad-texto-tenue)]">
                  28 segundos sin cortes: decide, aprende la pista y celebra.
                </p>
              </figcaption>
            </figure>

            {/* Captura derecha */}
            <figure className="ad-vista mx-auto w-full max-w-[240px] sm:max-w-none">
              <div className="ad-captura">
                <img
                  src={CAPTURAS[1].src}
                  alt={CAPTURAS[1].alt}
                  width={CAPTURAS[1].ancho}
                  height={CAPTURAS[1].alto}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <figcaption className="mt-4 px-1">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <span className="ad-numero">03</span>
                  {CAPTURAS[1].titulo}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-ad-texto-tenue)]">
                  {CAPTURAS[1].detalle}
                </p>
              </figcaption>
            </figure>
          </div>
        </section>

        {/* --- Manifiesto pedagógico --------------------------------------- */}
        <section className="ad-vista mx-auto mt-28 max-w-[42rem] text-center">
          <div className="ad-cita" aria-hidden="true" />
          <blockquote>
            <p className="ad-display text-[1.9rem] leading-[1.15] sm:text-[2.3rem]">
              Enseñamos jugando,
              <br />
              no asustando.
            </p>
            <p className="mx-auto mt-6 max-w-[34rem] text-[0.9375rem] leading-relaxed text-[var(--color-ad-texto-suave)]">
              Un niño que sale con miedo no aprendió: solo va a desconfiar de todo y a
              preguntar menos. Un niño que sale sintiéndose vivo vuelve a jugar — y le cuenta
              a un amigo.
            </p>
          </blockquote>
          <p className="ad-kicker mt-7">Nuestro principio de diseño</p>
        </section>

        {/* --- Apps simuladas -------------------------------------------- */}
        <section className="ad-vista mt-24 flex flex-wrap items-center justify-between gap-6 border-y border-[var(--color-ad-borde)] py-8">
          <div>
            <h2 className="ad-display text-[1.6rem]">Las trampas llegan donde ya vive.</h2>
            <p className="mt-1.5 text-sm text-[var(--color-ad-texto-suave)]">
              Cinco apps simuladas dentro de un teléfono que se siente real — y vienen más.
            </p>
          </div>
          {/* Dock como el del telefono: mismas baldosas e iconos del juego. */}
          <ul className="flex flex-wrap items-end gap-5 rounded-[1.6rem] border border-[var(--color-ad-borde)] bg-[rgb(255_255_255/0.05)] px-6 py-4 backdrop-blur shadow-[0_1px_0_0_rgb(255_255_255/0.07)_inset,0_25px_50px_-25px_rgb(0_0_0/0.9),0_0_50px_-10px_rgb(47_107_255/0.4)]">
            {APPS_SIMULADAS.map((app) => (
              <li key={app.nombre} className="group flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-[0.9rem] shadow-[0_12px_24px_-10px_rgb(0_0_0/0.85)] transition-all duration-200 group-hover:-translate-y-1.5 group-hover:scale-105 group-hover:shadow-[0_16px_30px_-10px_rgb(0_0_0/0.9),0_0_24px_-4px_rgb(47_107_255/0.55)] ${app.clase}`}
                >
                  <img
                    src={app.icono}
                    alt=""
                    draggable={false}
                    className={app.conFondo ? 'h-full w-full object-cover' : 'h-7 w-7'}
                  />
                </span>
                <span className="text-[11px] font-medium text-[var(--color-ad-texto-suave)]">
                  {app.nombre}
                </span>
              </li>
            ))}
            {/* Baldosa "pronto": el dock tambien crece. */}
            <li className="group flex flex-col items-center gap-1.5">
              <span
                aria-hidden="true"
                className="flex h-12 w-12 items-center justify-center rounded-[0.9rem] border-2 border-dashed border-[var(--color-ad-borde)] text-[var(--color-ad-texto-tenue)] transition-all duration-200 group-hover:-translate-y-1.5 group-hover:border-[var(--color-nivel-despierto)] group-hover:text-[var(--color-nivel-despierto)]"
              >
                <Plus className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-medium text-[var(--color-ad-texto-tenue)]">
                Pronto
              </span>
            </li>
          </ul>
        </section>

        {/* --- Hoja de ruta: el proyecto crece ----------------------------- */}
        <section className="mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="ad-kicker">El plan</p>
              <div className="ad-filete mt-4" />
              <h2 className="ad-display mt-6 text-[1.9rem] sm:text-[2.2rem]">
                Esto recién empieza.
              </h2>
            </div>
            <p className="max-w-[22rem] text-sm leading-relaxed text-[var(--color-ad-texto-suave)]">
              Las estafas evolucionan cada semana. El juego está construido para evolucionar
              con ellas.
            </p>
          </div>

          <ul className="mt-10 grid gap-5 sm:grid-cols-2">
            {HOJA_DE_RUTA.map((hito) => (
              <li key={hito.titulo} className="ad-tarjeta ad-carta ad-vista p-6">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.14em] ${
                    hito.estado === 'En camino'
                      ? 'bg-[rgb(47_107_255/0.18)] text-[var(--color-ad-acento-claro)]'
                      : 'bg-[rgb(245_165_36/0.16)] text-[var(--color-nivel-despierto)]'
                  }`}
                >
                  {hito.estado}
                </span>
                <h3 className="ad-display mt-3 text-[1.3rem]">{hito.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ad-texto-suave)]">
                  {hito.texto}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* --- Privacidad ------------------------------------------------- */}
        <section className="ad-tarjeta ad-tarjeta--brillo ad-vista mt-24 overflow-hidden p-8 sm:p-11">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
            <div>
              <p className="ad-kicker">Privacidad</p>
              <h2 className="ad-display mt-4 text-[2rem] leading-[1.05] sm:text-[2.35rem]">
                La cuenta es tuya.
                <br />
                El perfil de tu hijo no tiene datos suyos.
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-[var(--color-ad-texto-suave)]">
                Tú creas la cuenta y decides qué se activa. El perfil de tu hijo o hija guarda
                solo tres cosas: un apodo que elige de una lista, un avatar y su rango de edad.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ad-texto-tenue)]">
                Nunca le pedimos
              </p>
              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {PRIVACIDAD.map((item) => (
                  <li
                    key={item}
                    className="ad-prohibido ad-vista flex items-start gap-2.5 rounded-lg bg-[rgb(8_11_26/0.45)] px-3.5 py-2.5 text-sm text-[var(--color-ad-texto-suave)]"
                  >
                    <X className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--color-trampa)]" aria-hidden="true" />
                    <span className="ad-prohibido-texto">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-l-2 border-[var(--color-nivel-despierto)] pl-4 text-xs leading-relaxed text-[var(--color-ad-texto-tenue)]">
                Las estadísticas de uso y la conversación con IA en la nube son opcionales y
                vienen <strong className="text-[var(--color-ad-texto-suave)]">apagadas</strong>.
                Las activas tú, y las puedes apagar cuando quieras.
              </p>
            </div>
          </div>
        </section>

        {/* --- Cierre ------------------------------------------------------ */}
        <section className="ad-vista mt-28 text-center">
          <p className="ad-kicker">Empieza hoy</p>
          <h2 className="ad-display mx-auto mt-5 max-w-[28rem] text-[2.1rem] leading-[1.05] sm:text-[2.6rem]">
            Que la primera estafa que vea{' '}
            <em className="not-italic text-[var(--color-nivel-despierto)]">sea de mentira.</em>
          </h2>
          <button type="button" onClick={onEmpezar} className="ad-boton ad-boton--primario mt-9">
            Crear una cuenta
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <p className="mt-4 text-xs text-[var(--color-ad-texto-tenue)]">
            Te toma dos minutos y decides tú qué se activa.
          </p>
        </section>

        <footer className="mt-24 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-ad-borde)] pt-7 text-xs text-[var(--color-ad-texto-tenue)]">
          <p className="flex items-center gap-2">
            <img src={marca} alt="" aria-hidden="true" width={160} height={160} className="h-4 w-4" />
            Ponte Trucha Kids · Hackathon Kiro + AWS · Código Facilito
          </p>
          <p>Equipo KikiriKillers 🐔</p>
        </footer>
      </div>
    </div>
  );
}
