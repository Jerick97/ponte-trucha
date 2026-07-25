import { describe, it, expect } from 'vitest';
import {
  EDAD_MINIMA_ADULTO,
  VERSION_REGLA_AGE_GATE,
  evaluarAgeGate,
  esFechaPlausible,
} from '../onboarding/ageGate';

const HOY = new Date('2026-07-24T12:00:00Z');

describe('evaluarAgeGate', () => {
  it('aprueba a quien ya cumplio la edad minima', () => {
    const r = evaluarAgeGate({ dia: 24, mes: 7, anio: 1990 }, HOY);
    expect(r.aprobado).toBe(true);
  });

  it('aprueba exactamente el dia del cumpleanos que alcanza la edad minima', () => {
    const anio = HOY.getUTCFullYear() - EDAD_MINIMA_ADULTO;
    const r = evaluarAgeGate({ dia: 24, mes: 7, anio }, HOY);
    expect(r.aprobado).toBe(true);
  });

  it('rechaza a quien cumple la edad minima manana', () => {
    const anio = HOY.getUTCFullYear() - EDAD_MINIMA_ADULTO;
    const r = evaluarAgeGate({ dia: 25, mes: 7, anio }, HOY);
    expect(r.aprobado).toBe(false);
  });

  it('rechaza a un menor de edad', () => {
    const r = evaluarAgeGate({ dia: 1, mes: 1, anio: 2015 }, HOY);
    expect(r.aprobado).toBe(false);
  });

  // R1: el gate no debe revelar la regla que lo hace pasar.
  it('no revela la edad requerida ni la fecha en el motivo del rechazo', () => {
    const r = evaluarAgeGate({ dia: 1, mes: 1, anio: 2015 }, HOY);
    if (r.aprobado) throw new Error('se esperaba rechazo');
    expect(r.motivo).not.toMatch(new RegExp(String(EDAD_MINIMA_ADULTO)));
    expect(r.motivo).not.toMatch(/2015/);
    expect(r.motivo).not.toMatch(/18|edad m[ií]nima|a[ñn]os/i);
  });

  // R1 + seguridad-infantil.md: solo sale version de regla y timestamp.
  it('al aprobar solo entrega version de regla y timestamp, nunca la fecha', () => {
    const r = evaluarAgeGate({ dia: 24, mes: 7, anio: 1990 }, HOY);
    if (!r.aprobado) throw new Error('se esperaba aprobacion');
    expect(r.prueba.versionRegla).toBe(VERSION_REGLA_AGE_GATE);
    expect(r.prueba.aprobadoEn).toBe(HOY.toISOString());
    expect(Object.keys(r.prueba).sort()).toEqual(['aprobadoEn', 'versionRegla']);
    // Ni la fecha ni sus partes viajan dentro de la prueba.
    expect(JSON.stringify(r.prueba)).not.toMatch(/1990/);
  });

  it('rechaza fechas incompletas o imposibles sin reventar', () => {
    expect(evaluarAgeGate({ dia: 0, mes: 0, anio: 0 }, HOY).aprobado).toBe(false);
    expect(evaluarAgeGate({ dia: 31, mes: 2, anio: 1990 }, HOY).aprobado).toBe(false);
    expect(evaluarAgeGate({ dia: 15, mes: 13, anio: 1990 }, HOY).aprobado).toBe(false);
  });

  it('rechaza una fecha futura', () => {
    expect(evaluarAgeGate({ dia: 1, mes: 1, anio: 2030 }, HOY).aprobado).toBe(false);
  });
});

describe('esFechaPlausible', () => {
  it('acepta una fecha calendario valida', () => {
    expect(esFechaPlausible({ dia: 29, mes: 2, anio: 2000 })).toBe(true);
  });

  it('rechaza un 29 de febrero de anio no bisiesto', () => {
    expect(esFechaPlausible({ dia: 29, mes: 2, anio: 1999 })).toBe(false);
  });

  it('rechaza un anio absurdamente antiguo', () => {
    expect(esFechaPlausible({ dia: 1, mes: 1, anio: 1200 })).toBe(false);
  });
});
