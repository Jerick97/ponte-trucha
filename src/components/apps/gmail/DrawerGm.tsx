/**
 * Drawer lateral de Gmail: wordmark rojo, bandejas con Principal
 * seleccionada (pildora celeste), etiquetas y aplicaciones de Google.
 * Todo decorativo salvo cerrar: da profundidad sin abrir alcance.
 */

import {
  CalendarClock,
  CalendarDays,
  CircleAlert,
  CircleHelp,
  CircleUser,
  Clock,
  File,
  Inbox,
  Info,
  Mail,
  MonitorSmartphone,
  Send,
  SendHorizontal,
  Settings,
  Star,
  Tag,
  Tags,
  Trash2,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useArrastreScroll } from '../../telefono/useArrastreScroll';

interface Props {
  onCerrar: () => void;
}

interface FilaDrawer {
  icono: LucideIcon;
  nombre: string;
  etiqueta?: string;
  /** Pildora de color en la etiqueta (categorias con correos nuevos). */
  claseEtiqueta?: string;
  seleccionada?: boolean;
}

const BANDEJAS: FilaDrawer[] = [
  { icono: MonitorSmartphone, nombre: 'Todas las bandejas' },
  { icono: Inbox, nombre: 'Principal', etiqueta: '99+', seleccionada: true },
  {
    icono: Tag,
    nombre: 'Promociones',
    etiqueta: '15 nue.',
    claseEtiqueta: 'bg-[var(--color-gm-verde)]/15 text-[var(--color-gm-verde)]',
  },
  { icono: Users, nombre: 'Social' },
  {
    icono: Info,
    nombre: 'Notificaciones',
    etiqueta: '450 nue.',
    claseEtiqueta: 'bg-[var(--color-gm-avatar-naranja)]/20 text-[var(--color-gm-naranja)]',
  },
];

const ETIQUETAS: FilaDrawer[] = [
  { icono: Star, nombre: 'Destacados' },
  { icono: Clock, nombre: 'Pospuestos' },
  { icono: Tags, nombre: 'Importantes', etiqueta: '105' },
  { icono: Send, nombre: 'Enviados' },
  { icono: CalendarClock, nombre: 'Programado' },
  { icono: SendHorizontal, nombre: 'Bandeja de salida' },
  { icono: File, nombre: 'Borradores' },
  { icono: Mail, nombre: 'Todos', etiqueta: '99+' },
  { icono: CircleAlert, nombre: 'Spam' },
  { icono: Trash2, nombre: 'Papelera', etiqueta: '1' },
];

const APLICACIONES: FilaDrawer[] = [
  { icono: CalendarDays, nombre: 'Calendar' },
  { icono: CircleUser, nombre: 'Contactos' },
];

const AJUSTES: FilaDrawer[] = [
  { icono: Settings, nombre: 'Ajustes' },
  { icono: CircleHelp, nombre: 'Ayuda y comentarios' },
];

function Fila({ icono: Icono, nombre, etiqueta, claseEtiqueta, seleccionada }: FilaDrawer) {
  return (
    <div
      className={`mr-3 flex items-center gap-5 rounded-r-full py-3 pl-5 pr-4 text-sm ${
        seleccionada ? 'bg-[var(--color-gm-seleccion)] font-semibold' : ''
      }`}
    >
      <Icono aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--color-gm-texto-suave)]" />
      <span className="flex-1">{nombre}</span>
      {etiqueta &&
        (claseEtiqueta ? (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${claseEtiqueta}`}>{etiqueta}</span>
        ) : (
          <span className="text-xs text-[var(--color-gm-texto-suave)]">{etiqueta}</span>
        ))}
    </div>
  );
}

function Separador({ titulo }: { titulo?: string }) {
  return titulo ? (
    <p className="px-5 pb-1 pt-4 text-xs text-[var(--color-gm-texto-suave)]">{titulo}</p>
  ) : (
    <hr className="my-2 border-[var(--color-gm-superficie)]" />
  );
}

export function DrawerGm({ onCerrar }: Props) {
  const arrastre = useArrastreScroll();

  return (
    <div className="absolute inset-0 z-20 flex">
      <div className="flex h-full w-[85%] flex-col bg-[var(--color-gm-fondo)] pt-10 text-[var(--color-gm-texto)] shadow-2xl">
        <p className="px-5 pb-3 text-2xl font-semibold text-[var(--color-gm-rojo)]">Gmail</p>
        <div
          ref={arrastre.contenedor}
          className="sin-scrollbar min-h-0 flex-1 touch-pan-y overflow-y-auto pb-8"
          onPointerDown={arrastre.alPresionar}
          onPointerMove={arrastre.alMover}
          onPointerUp={arrastre.alSoltar}
          onPointerCancel={arrastre.alSoltar}
          onClickCapture={arrastre.alCapturarClick}
        >
          {BANDEJAS.map((fila) => (
            <Fila key={fila.nombre} {...fila} />
          ))}
          <Separador titulo="Todas las etiquetas" />
          {ETIQUETAS.map((fila) => (
            <Fila key={fila.nombre} {...fila} />
          ))}
          <Separador titulo="Aplicaciones de Google" />
          {APLICACIONES.map((fila) => (
            <Fila key={fila.nombre} {...fila} />
          ))}
          <Separador />
          {AJUSTES.map((fila) => (
            <Fila key={fila.nombre} {...fila} />
          ))}
        </div>
      </div>
      <button type="button" aria-label="Cerrar el menú" onClick={onCerrar} className="h-full flex-1 bg-black/40" />
    </div>
  );
}
