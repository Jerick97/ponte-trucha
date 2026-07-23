import { describe, expect, it } from 'vitest';
import { APPS, appPorCanal } from '../components/telefono/apps';
import type { CanalMensaje } from '../types/escenario';

/**
 * Lista de canales del contrato. El `satisfies` garantiza que solo haya
 * canales validos, y el chequeo de exhaustividad de abajo obliga a
 * actualizar esta lista (y por tanto el registro) si el contrato crece.
 */
const CANALES = ['chat-juego', 'whatsapp', 'correo', 'discord', 'sms'] as const satisfies readonly CanalMensaje[];

type CanalFaltante = Exclude<CanalMensaje, (typeof CANALES)[number]>;
// Si esta linea no compila, se agrego un canal al contrato sin cubrirlo aqui.
const _todosLosCanalesCubiertos: CanalFaltante extends never ? true : never = true;
void _todosLosCanalesCubiertos;

describe('registro de apps del telefono', () => {
  it('todo canal del contrato tiene una app que lo renderiza', () => {
    for (const canal of CANALES) {
      const app = appPorCanal(canal);
      expect(app, `el canal ${canal} no tiene app`).toBeDefined();
      expect(app.canal).toBe(canal);
    }
  });

  it('mapea correo a Gmail y sms a Mensajes', () => {
    expect(appPorCanal('correo').id).toBe('gmail');
    expect(appPorCanal('sms').id).toBe('mensajes');
  });

  it('no hay apps con id o canal duplicado', () => {
    const ids = APPS.map((app) => app.id);
    const canales = APPS.map((app) => app.canal);
    expect(new Set(ids).size).toBe(APPS.length);
    expect(new Set(canales).size).toBe(APPS.length);
  });

  it('el orden del grid es estable', () => {
    expect(APPS.map((app) => app.id)).toEqual([
      'whatsapp',
      'mensajes',
      'discord',
      'gmail',
      'chat-juego',
    ]);
  });

  it('cada app tiene nombre visible y clase de icono', () => {
    for (const app of APPS) {
      expect(app.nombre.trim()).not.toBe('');
      expect(app.claseIcono.trim()).not.toBe('');
    }
  });
});
