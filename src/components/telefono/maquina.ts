/**
 * Maquina de estados del telefono simulado. Reducer puro: sin React,
 * sin timers, sin DOM. App.tsx la consume con useReducer y dispara
 * FIN_ANIMACION desde un useEffect cuando termina el arranque.
 */

/** Identificador de una app del home. El registro completo vive en apps.ts. */
export type AppId = 'whatsapp' | 'mensajes' | 'discord' | 'gmail' | 'chat-juego';

export type Energia = 'apagado' | 'encendiendo' | 'encendido';

export interface EstadoTelefono {
  energia: Energia;
  /** Solo tiene efecto visual con energia === 'encendido'. */
  bloqueado: boolean;
  /** Mostrando la parte trasera; ortogonal al resto del estado. */
  girado: boolean;
  appAbierta: AppId | null;
}

export type EventoTelefono =
  | { tipo: 'ENCENDER'; saltarAnimacion?: boolean }
  | { tipo: 'FIN_ANIMACION' }
  | { tipo: 'DESBLOQUEAR' }
  | { tipo: 'BLOQUEAR' }
  | { tipo: 'GIRAR' }
  | { tipo: 'ABRIR_APP'; app: AppId }
  | { tipo: 'CERRAR_APP' };

export const ESTADO_INICIAL: EstadoTelefono = {
  energia: 'apagado',
  bloqueado: true,
  girado: false,
  appAbierta: null,
};

/**
 * Transicion pura. Un evento que no aplica en el estado actual devuelve
 * el MISMO objeto (identidad referencial): asi React no re-renderiza
 * y los tests pueden verificar la ignorancia con toBe.
 */
export function transicion(estado: EstadoTelefono, evento: EventoTelefono): EstadoTelefono {
  switch (evento.tipo) {
    case 'ENCENDER':
      if (estado.energia !== 'apagado') return estado;
      return { ...estado, energia: evento.saltarAnimacion ? 'encendido' : 'encendiendo' };

    case 'FIN_ANIMACION':
      if (estado.energia !== 'encendiendo') return estado;
      return { ...estado, energia: 'encendido' };

    case 'DESBLOQUEAR':
      if (estado.energia !== 'encendido' || !estado.bloqueado) return estado;
      return { ...estado, bloqueado: false };

    case 'BLOQUEAR':
      if (estado.energia !== 'encendido' || estado.bloqueado) return estado;
      return { ...estado, bloqueado: true };

    case 'GIRAR':
      if (estado.energia !== 'encendido') return estado;
      return { ...estado, girado: !estado.girado };

    case 'ABRIR_APP':
      if (estado.energia !== 'encendido' || estado.bloqueado || estado.girado) return estado;
      if (estado.appAbierta === evento.app) return estado;
      return { ...estado, appAbierta: evento.app };

    case 'CERRAR_APP':
      if (estado.appAbierta === null) return estado;
      return { ...estado, appAbierta: null };
  }
}
