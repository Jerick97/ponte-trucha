/**
 * Detalle de un juego como en la app movil real: modal que crece desde
 * abajo con X para cerrar, carrusel con dots, descripcion corta con "mas",
 * lista de Informacion y recomendaciones de los otros juegos del banco.
 * El boton Jugar y los circulos de la barra inferior son decorativos.
 */

import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import {
  BadgeCheck,
  Bell,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  ThumbsDown,
  ThumbsUp,
  UserRoundPlus,
  Users,
  X,
} from 'lucide-react';
import { useArrastreScroll } from '../../telefono/useArrastreScroll';
import { JUEGOS_RB, type EmblemaRb, type JuegoRb } from './datosJuegos';

interface Props {
  juego: JuegoRb;
  onCerrar: () => void;
  /** Cambia a otro juego desde "Las personas tambien se unen a". */
  onAbrirJuego: (juego: JuegoRb) => void;
}

/** Ms entre cambios automaticos del carrusel, como en la app real. */
const MS_CARRUSEL = 3500;

function prefiereMenosMovimiento(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/**
 * Carrusel por indice (translateX): avanza solo, se arrastra y sus dots
 * siempre calzan. El scroll nativo con snap peleaba con el arrastre.
 */
function useCarrusel(total: number) {
  const [indice, setIndice] = useState(0);
  const inicioX = useRef<number | null>(null);
  const sinAnimacion = prefiereMenosMovimiento();

  // Auto-avance; incluir `indice` reinicia el conteo tras un gesto manual.
  useEffect(() => {
    if (sinAnimacion || total < 2) return;
    const temporizador = setTimeout(() => setIndice((i) => (i + 1) % total), MS_CARRUSEL);
    return () => clearTimeout(temporizador);
  }, [indice, total, sinAnimacion]);

  function alPresionar(evento: PointerEvent<HTMLDivElement>) {
    inicioX.current = evento.clientX;
  }
  function alSoltar(evento: PointerEvent<HTMLDivElement>) {
    if (inicioX.current === null) return;
    const dx = evento.clientX - inicioX.current;
    inicioX.current = null;
    if (dx < -40) setIndice((i) => Math.min(i + 1, total - 1));
    else if (dx > 40) setIndice((i) => Math.max(i - 1, 0));
  }

  return { indice, sinAnimacion, alPresionar, alSoltar };
}

/**
 * Arrastre y rueda para filas horizontales sueltas (eventos). Sin snap:
 * el scroll nativo por scrollLeft se siente natural aqui.
 */
function useArrastreHorizontal() {
  const contenedor = useRef<HTMLDivElement | null>(null);
  const inicio = useRef<{ x: number; scrollLeft: number } | null>(null);

  useEffect(() => {
    const elemento = contenedor.current;
    if (!elemento) return;
    function alRodar(evento: WheelEvent) {
      const el = contenedor.current;
      if (!el) return;
      evento.preventDefault();
      el.scrollLeft += evento.deltaY + evento.deltaX;
    }
    elemento.addEventListener('wheel', alRodar, { passive: false });
    return () => elemento.removeEventListener('wheel', alRodar);
  }, []);

  function alPresionar(evento: PointerEvent<HTMLDivElement>) {
    inicio.current = { x: evento.clientX, scrollLeft: evento.currentTarget.scrollLeft };
    evento.currentTarget.setPointerCapture(evento.pointerId);
  }
  function alMover(evento: PointerEvent<HTMLDivElement>) {
    if (!inicio.current) return;
    evento.currentTarget.scrollLeft = inicio.current.scrollLeft - (evento.clientX - inicio.current.x);
  }
  function alSoltar(evento: PointerEvent<HTMLDivElement>) {
    inicio.current = null;
    evento.currentTarget.releasePointerCapture?.(evento.pointerId);
  }

  return { contenedor, alPresionar, alMover, alSoltar };
}

/**
 * Grilla de insignias en pantalla completa. Es un componente aparte para
 * que su hook de scroll se monte junto con su contenedor (si no, la rueda
 * queda enganchada al contenedor del detalle y aqui no desplaza).
 */
function VistaInsignias({ emblemas, onVolver }: { emblemas: EmblemaRb[]; onVolver: () => void }) {
  const scroll = useArrastreScroll();

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-[var(--color-rb-fondo)] text-[var(--color-rb-texto)]">
      <header className="flex items-center gap-4 px-4 pb-3 pt-14">
        <button type="button" aria-label="Volver al juego" onClick={onVolver}>
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h2 className="text-xl font-bold">Insignias</h2>
      </header>
      <div
        ref={scroll.contenedor}
        className="sin-scrollbar min-h-0 flex-1 touch-pan-y overflow-y-auto pb-10"
        onPointerDown={scroll.alPresionar}
        onPointerMove={scroll.alMover}
        onPointerUp={scroll.alSoltar}
        onPointerCancel={scroll.alSoltar}
        onClickCapture={scroll.alCapturarClick}
      >
        <ul className="grid grid-cols-3 gap-3 px-4">
          {emblemas.map((emblema) => (
            <li key={emblema.nombre} className="rounded-xl bg-[var(--color-rb-superficie)] p-3">
              <img src={emblema.imagen} alt="" draggable={false} className="w-full rounded-full" />
              <p className="truncate pt-2 text-sm">{emblema.nombre}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const CLASE_H2 = 'px-4 pb-2 pt-4 text-lg font-bold';
const CLASE_FILA_INFO =
  'flex items-center justify-between border-b border-[var(--color-rb-superficie)] px-4 py-3 text-sm';

export function DetalleJuegoRb({ juego, onCerrar, onAbrirJuego }: Props) {
  const carrusel = useCarrusel(juego.capturas.length);
  const scroll = useArrastreScroll();
  const eventos = useArrastreHorizontal();
  const [descripcionAbierta, setDescripcionAbierta] = useState(false);
  const [conInsignias, setConInsignias] = useState(false);
  const { detalle } = juego;
  const otros = JUEGOS_RB.filter((otro) => otro.id !== juego.id);


  return (
    <div className="absolute inset-0 z-10 flex flex-col">
      {/* Franja oscura superior del modal, con la X como en la app real */}
      <div className="bg-black/60 px-4 pb-3 pt-14">
        <button type="button" aria-label="Cerrar juego" onClick={onCerrar}>
          <X className="h-7 w-7 text-white" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-t-2xl bg-[var(--color-rb-fondo)] text-[var(--color-rb-texto)]">
        <div
          ref={scroll.contenedor}
          className="sin-scrollbar min-h-0 flex-1 touch-pan-y overflow-y-auto pb-3"
          onPointerDown={scroll.alPresionar}
          onPointerMove={scroll.alMover}
          onPointerUp={scroll.alSoltar}
          onPointerCancel={scroll.alSoltar}
          onClickCapture={scroll.alCapturarClick}
        >
          <header className="flex items-start gap-3 px-4 pb-3 pt-4">
            <img src={juego.icono} alt="" draggable={false} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
            <span className="min-w-0">
              <span className="block text-xl font-bold leading-tight">{juego.nombre}</span>
              <span className="flex items-center gap-1 pt-0.5 text-sm text-[var(--color-rb-texto-suave)]">
                <span className="truncate">{juego.creador}</span>
                {juego.verificado && <BadgeCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--color-rb-azul)]" />}
              </span>
              <span className="block text-sm text-[var(--color-rb-texto-suave)]">Madurez: {juego.madurez}</span>
            </span>
          </header>

          {/* Carrusel de capturas: avanza solo, se arrastra y marca el dot */}
          <div
            className="relative mx-4 overflow-hidden rounded-xl"
            onPointerDown={carrusel.alPresionar}
            onPointerUp={carrusel.alSoltar}
            onPointerCancel={carrusel.alSoltar}
            aria-label={`Capturas de ${juego.nombre}`}
          >
            <div
              className={`flex ${carrusel.sinAnimacion ? '' : 'transition-transform duration-500'}`}
              style={{ transform: `translateX(-${carrusel.indice * 100}%)` }}
            >
              {juego.capturas.map((imagen, i) => (
                <img
                  key={i}
                  src={imagen}
                  alt=""
                  draggable={false}
                  className="aspect-video w-full shrink-0 object-cover"
                />
              ))}
            </div>
            <span aria-hidden="true" className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
              {juego.capturas.map((_, i) => (
                <i
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === carrusel.indice ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </span>
          </div>

          <div aria-hidden="true" className="flex gap-2 px-4 pt-3 text-sm">
            <span className="flex shrink-0 items-center whitespace-nowrap rounded-full bg-[var(--color-rb-pildora)]">
              <span className="flex items-center gap-1.5 py-2 pl-3 pr-2">
                <ThumbsUp className="h-4 w-4" />
                {juego.valoracion}%
              </span>
              <span className="h-4 w-px bg-[var(--color-rb-texto-suave)]/40" />
              <span className="py-2 pl-2 pr-3">
                <ThumbsDown className="h-4 w-4" />
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--color-rb-pildora)] px-3 py-2">
              <Users className="h-4 w-4" />
              {juego.activos} activos
            </span>
            <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--color-rb-pildora)] px-3 py-2">
              <Bell className="h-4 w-4" />
              Notificar
            </span>
          </div>

          {detalle?.eventos && (
            <section aria-hidden="true">
              <h2 className={CLASE_H2}>Eventos</h2>
              <div
                ref={eventos.contenedor}
                className="sin-scrollbar flex gap-3 overflow-x-auto px-4"
                onPointerDown={eventos.alPresionar}
                onPointerMove={eventos.alMover}
                onPointerUp={eventos.alSoltar}
                onPointerCancel={eventos.alSoltar}
              >
                {detalle.eventos.map((evento, _indice, lista) => (
                  <div
                    key={evento.nombre}
                    className={`${lista.length === 1 ? 'w-full' : 'w-[85%]'} shrink-0 overflow-hidden rounded-xl bg-[var(--color-rb-superficie)]`}
                  >
                    <span className="relative block">
                      <img src={evento.imagen} alt="" draggable={false} className="aspect-video w-full object-cover" />
                      {/* Chip blanco como en la app; "En curso" permite unirse */}
                      <span className="absolute left-2 top-2 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--color-rb-fondo)]">
                        {evento.chip}
                      </span>
                    </span>
                    <span className="block px-3 pt-2 text-sm font-bold">{evento.nombre}</span>
                    <span className="block px-3 text-xs text-[var(--color-rb-texto-suave)]">{evento.subtitulo}</span>
                    {evento.chip === 'En curso' ? (
                      <span className="mx-3 my-2.5 block rounded-lg bg-[var(--color-rb-azul)] py-2 text-center text-sm font-semibold text-white">
                        Unirse a Evento
                      </span>
                    ) : (
                      <span className="mx-3 my-2.5 block rounded-lg bg-[var(--color-rb-pildora)] py-2 text-center text-sm font-semibold">
                        Notifícame
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {detalle && (
            <>
              <section>
                <h2 className={CLASE_H2}>Descripción</h2>
                {/* Colapsada corta a pocas lineas con "mas", como en la app */}
                <div className={`px-4 ${descripcionAbierta ? '' : 'line-clamp-4'}`}>
                  {detalle.descripcion.map((parrafo) => (
                    <p key={parrafo} className="whitespace-pre-line pb-2 text-sm leading-snug">
                      {parrafo}
                    </p>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setDescripcionAbierta(!descripcionAbierta)}
                  className="px-4 pb-1 text-sm font-semibold underline"
                >
                  {descripcionAbierta ? 'menos' : 'más'}
                </button>
              </section>

              <section>
                <h2 className={CLASE_H2}>Información</h2>
                <div className={CLASE_FILA_INFO}>
                  <span className="text-[var(--color-rb-texto-suave)]">Visitas</span>
                  <span className="font-semibold">{detalle.info.visitas}</span>
                </div>
                <div className={CLASE_FILA_INFO}>
                  <span className="text-[var(--color-rb-texto-suave)]">Madurez del contenido</span>
                  <span aria-hidden="true" className="flex items-center gap-1 font-semibold">
                    {juego.madurez}
                    <ChevronRight className="h-4 w-4 text-[var(--color-rb-texto-suave)]" />
                  </span>
                </div>
                <div className={CLASE_FILA_INFO}>
                  <span className="text-[var(--color-rb-texto-suave)]">Desarrollador</span>
                  <span aria-hidden="true" className="flex items-center gap-1 font-semibold">
                    {juego.creador}
                    {juego.verificado && <BadgeCheck className="h-4 w-4 text-[var(--color-rb-azul)]" />}
                    <ChevronRight className="h-4 w-4 text-[var(--color-rb-texto-suave)]" />
                  </span>
                </div>
                <div className={CLASE_FILA_INFO}>
                  <span className="text-[var(--color-rb-texto-suave)]">Tamaño del servidor</span>
                  <span className="font-semibold">{detalle.info.tamanoServidor}</span>
                </div>
                <div className={CLASE_FILA_INFO}>
                  <span className="text-[var(--color-rb-texto-suave)]">Género</span>
                  <span className="font-semibold">{detalle.info.genero}</span>
                </div>
                {detalle.info.subgenero && (
                  <div className={CLASE_FILA_INFO}>
                    <span className="text-[var(--color-rb-texto-suave)]">Subgénero</span>
                    <span className="font-semibold">{detalle.info.subgenero}</span>
                  </div>
                )}
                <div className={CLASE_FILA_INFO}>
                  <span className="text-[var(--color-rb-texto-suave)]">Creada</span>
                  <span className="font-semibold">{detalle.info.creada}</span>
                </div>
                <div className={CLASE_FILA_INFO}>
                  <span className="text-[var(--color-rb-texto-suave)]">Actualizada</span>
                  <span className="font-semibold">{detalle.info.actualizada}</span>
                </div>
                <div className={CLASE_FILA_INFO}>
                  <span className="text-[var(--color-rb-texto-suave)]">Chat de voz</span>
                  <span className="font-semibold">{detalle.info.chatVoz}</span>
                </div>
                <div className={CLASE_FILA_INFO}>
                  <span className="text-[var(--color-rb-texto-suave)]">Cámara</span>
                  <span className="font-semibold">{detalle.info.camara}</span>
                </div>
                {detalle.emblemas && (
                  <button type="button" onClick={() => setConInsignias(true)} className={`${CLASE_FILA_INFO} w-full text-left`}>
                    <span className="text-[var(--color-rb-texto-suave)]">Emblemas</span>
                    <span className="flex items-center gap-1 font-semibold">
                      Ver
                      <ChevronRight className="h-4 w-4 text-[var(--color-rb-texto-suave)]" />
                    </span>
                  </button>
                )}
                <div aria-hidden="true" className={CLASE_FILA_INFO}>
                  <span className="text-[var(--color-rb-texto-suave)]">Servidores</span>
                  <span className="flex items-center gap-1 font-semibold">
                    Ver
                    <ChevronRight className="h-4 w-4 text-[var(--color-rb-texto-suave)]" />
                  </span>
                </div>
              </section>
            </>
          )}

          <section>
            <h2 className={CLASE_H2}>Las personas también se unen a</h2>
            <div className="flex gap-3 overflow-hidden px-4">
              {otros.slice(0, 4).map((otro) => (
                <button key={otro.id} type="button" onClick={() => onAbrirJuego(otro)} className="w-20 shrink-0 text-left">
                  <img src={otro.icono} alt="" draggable={false} className="aspect-square w-full rounded-lg object-cover" />
                  <span className="mt-1 line-clamp-2 text-xs font-semibold leading-tight">{otro.nombre}</span>
                  {/* Siempre 1 linea: el conteo de jugadores se trunca con ... */}
                  <span className="flex items-center gap-1 overflow-hidden whitespace-nowrap pt-0.5 text-[10px] text-[var(--color-rb-texto-suave)]">
                    <ThumbsUp aria-hidden="true" className="h-2.5 w-2.5 shrink-0" />
                    <span className="shrink-0">{otro.valoracion}%</span>
                    <Users aria-hidden="true" className="ml-1 h-2.5 w-2.5 shrink-0" />
                    <span className="min-w-0 truncate">{otro.activos}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Barra fija inferior: ... , seguir al juego y Jugar */}
        <div aria-hidden="true" className="flex items-center gap-3 border-t border-[var(--color-rb-superficie)] px-4 pb-9 pt-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-rb-superficie-alta)]">
            <Ellipsis className="h-5 w-5" />
          </span>
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-rb-superficie-alta)]">
            <UserRoundPlus className="h-5 w-5" />
          </span>
          <span className="flex h-11 flex-1 items-center justify-center rounded-xl bg-[var(--color-rb-azul)] text-[15px] font-bold text-white">
            Jugar
          </span>
        </div>
      </div>

      {/* Insignias por encima; el detalle sigue montado y no pierde su scroll */}
      {conInsignias && detalle?.emblemas && (
        <VistaInsignias emblemas={detalle.emblemas} onVolver={() => setConInsignias(false)} />
      )}
    </div>
  );
}
