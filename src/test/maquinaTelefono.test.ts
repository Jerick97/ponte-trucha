import { describe, expect, it } from 'vitest';
import {
  ESTADO_INICIAL,
  transicion,
  type EstadoTelefono,
} from '../components/telefono/maquina';

/** Atajo: aplica una secuencia de eventos desde el estado inicial. */
function tras(...eventos: Parameters<typeof transicion>[1][]): EstadoTelefono {
  return eventos.reduce(transicion, ESTADO_INICIAL);
}

const ENCENDIDO_BLOQUEADO = tras({ tipo: 'ENCENDER', saltarAnimacion: true });
const EN_HOME = tras({ tipo: 'ENCENDER', saltarAnimacion: true }, { tipo: 'DESBLOQUEAR' });

describe('maquina del telefono: encendido', () => {
  it('arranca apagado, bloqueado y mirando al frente', () => {
    expect(ESTADO_INICIAL).toEqual({
      energia: 'apagado',
      bloqueado: true,
      girado: false,
      appAbierta: null,
    });
  });

  it('ENCENDER pasa a encendiendo (la animacion corre)', () => {
    const estado = tras({ tipo: 'ENCENDER' });
    expect(estado.energia).toBe('encendiendo');
    expect(estado.bloqueado).toBe(true);
  });

  it('FIN_ANIMACION deja el telefono encendido en la pantalla de bloqueo', () => {
    const estado = tras({ tipo: 'ENCENDER' }, { tipo: 'FIN_ANIMACION' });
    expect(estado.energia).toBe('encendido');
    expect(estado.bloqueado).toBe(true);
  });

  it('ENCENDER con saltarAnimacion va directo a encendido (reduced motion)', () => {
    expect(ENCENDIDO_BLOQUEADO.energia).toBe('encendido');
    expect(ENCENDIDO_BLOQUEADO.bloqueado).toBe(true);
  });

  it('FIN_ANIMACION fuera de encendiendo se ignora', () => {
    expect(transicion(ESTADO_INICIAL, { tipo: 'FIN_ANIMACION' })).toBe(ESTADO_INICIAL);
    expect(transicion(EN_HOME, { tipo: 'FIN_ANIMACION' })).toBe(EN_HOME);
  });

  it('ENCENDER con el telefono ya encendido se ignora', () => {
    expect(transicion(EN_HOME, { tipo: 'ENCENDER' })).toBe(EN_HOME);
  });
});

describe('maquina del telefono: bloqueo y desbloqueo', () => {
  it('DESBLOQUEAR abre el home', () => {
    expect(EN_HOME.bloqueado).toBe(false);
    expect(EN_HOME.appAbierta).toBeNull();
  });

  it('DESBLOQUEAR se ignora si el telefono no esta encendido', () => {
    expect(transicion(ESTADO_INICIAL, { tipo: 'DESBLOQUEAR' })).toBe(ESTADO_INICIAL);
    const encendiendo = tras({ tipo: 'ENCENDER' });
    expect(transicion(encendiendo, { tipo: 'DESBLOQUEAR' })).toBe(encendiendo);
  });

  it('BLOQUEAR vuelve a la pantalla de bloqueo', () => {
    const estado = transicion(EN_HOME, { tipo: 'BLOQUEAR' });
    expect(estado.bloqueado).toBe(true);
    expect(estado.energia).toBe('encendido');
  });

  it('BLOQUEAR conserva la app abierta y DESBLOQUEAR vuelve a ella', () => {
    const conApp = transicion(EN_HOME, { tipo: 'ABRIR_APP', app: 'whatsapp' });
    const bloqueado = transicion(conApp, { tipo: 'BLOQUEAR' });
    expect(bloqueado.appAbierta).toBe('whatsapp');

    const desbloqueado = transicion(bloqueado, { tipo: 'DESBLOQUEAR' });
    expect(desbloqueado.appAbierta).toBe('whatsapp');
    expect(desbloqueado.bloqueado).toBe(false);
  });
});

describe('maquina del telefono: apps', () => {
  it('ABRIR_APP desde el home abre la app', () => {
    const estado = transicion(EN_HOME, { tipo: 'ABRIR_APP', app: 'gmail' });
    expect(estado.appAbierta).toBe('gmail');
  });

  it('CERRAR_APP vuelve al home', () => {
    const estado = tras(
      { tipo: 'ENCENDER', saltarAnimacion: true },
      { tipo: 'DESBLOQUEAR' },
      { tipo: 'ABRIR_APP', app: 'discord' },
      { tipo: 'CERRAR_APP' },
    );
    expect(estado.appAbierta).toBeNull();
    expect(estado.bloqueado).toBe(false);
  });

  it('la camara abre desde el bloqueo sin desbloquear y al cerrar vuelve al lock', () => {
    const conCamara = transicion(ENCENDIDO_BLOQUEADO, { tipo: 'ABRIR_APP', app: 'camara' });
    expect(conCamara.appAbierta).toBe('camara');
    expect(conCamara.bloqueado).toBe(true);

    const cerrado = transicion(conCamara, { tipo: 'CERRAR_APP' });
    expect(cerrado.appAbierta).toBeNull();
    expect(cerrado.bloqueado).toBe(true);
  });

  it('ABRIR_APP se ignora con el telefono bloqueado, girado o apagado', () => {
    expect(transicion(ESTADO_INICIAL, { tipo: 'ABRIR_APP', app: 'sms' as never })).toBe(
      ESTADO_INICIAL,
    );
    expect(transicion(ENCENDIDO_BLOQUEADO, { tipo: 'ABRIR_APP', app: 'mensajes' })).toBe(
      ENCENDIDO_BLOQUEADO,
    );
    const girado = transicion(EN_HOME, { tipo: 'GIRAR' });
    expect(transicion(girado, { tipo: 'ABRIR_APP', app: 'mensajes' })).toBe(girado);
  });
});

describe('maquina del telefono: giro', () => {
  it('GIRAR muestra la parte trasera y GIRAR de nuevo vuelve al frente', () => {
    const girado = transicion(EN_HOME, { tipo: 'GIRAR' });
    expect(girado.girado).toBe(true);
    expect(transicion(girado, { tipo: 'GIRAR' }).girado).toBe(false);
  });

  it('GIRAR no altera bloqueo ni app abierta', () => {
    const conApp = transicion(EN_HOME, { tipo: 'ABRIR_APP', app: 'chat-juego' });
    const girado = transicion(conApp, { tipo: 'GIRAR' });
    expect(girado.appAbierta).toBe('chat-juego');
    expect(girado.bloqueado).toBe(false);
  });

  it('GIRAR se ignora si el telefono no esta encendido', () => {
    expect(transicion(ESTADO_INICIAL, { tipo: 'GIRAR' })).toBe(ESTADO_INICIAL);
    const encendiendo = tras({ tipo: 'ENCENDER' });
    expect(transicion(encendiendo, { tipo: 'GIRAR' })).toBe(encendiendo);
  });
});
