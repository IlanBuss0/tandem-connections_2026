import { describe, expect, it } from 'vitest';
import type { SharedSupportAgreement, SharedSupportObjective } from '@/data/api';
import { nowCount, pendingAgreements, relativeDays, sessionLabel, staleObjective } from './collaborationHelpers';

const NOW = new Date('2026-09-23T12:00:00Z');
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86400000).toISOString();

function agreement(overrides: Partial<SharedSupportAgreement> = {}): SharedSupportAgreement {
  return { id: 1, id_perteneciente: 1, id_usuario_creador: 1, texto: 'Acuerdo', completado: false, fecha_creacion: daysAgo(3), fecha_actualizacion: daysAgo(3), ...overrides };
}

function objective(overrides: Partial<SharedSupportObjective> = {}): SharedSupportObjective {
  return { id: 1, id_perteneciente: 1, id_usuario_creador: 1, titulo: 'Objetivo', descripcion: null, estado: 'activo', progreso: 30, fecha_creacion: daysAgo(10), fecha_actualizacion: daysAgo(10), ...overrides };
}

describe('relativeDays', () => {
  it('hoy', () => expect(relativeDays(daysAgo(0), NOW)).toBe('hoy'));
  it('ayer', () => expect(relativeDays(daysAgo(1), NOW)).toBe('ayer'));
  it('hace N días (2 a 6)', () => {
    expect(relativeDays(daysAgo(2), NOW)).toBe('hace 2 días');
    expect(relativeDays(daysAgo(6), NOW)).toBe('hace 6 días');
  });
  it('hace 1 semana (7 a 13)', () => {
    expect(relativeDays(daysAgo(7), NOW)).toBe('hace 1 semana');
    expect(relativeDays(daysAgo(13), NOW)).toBe('hace 1 semana');
  });
  it('hace N semanas (14 o más)', () => {
    expect(relativeDays(daysAgo(14), NOW)).toBe('hace 2 semanas');
    expect(relativeDays(daysAgo(20), NOW)).toBe('hace 2 semanas');
    expect(relativeDays(daysAgo(21), NOW)).toBe('hace 3 semanas');
  });
  it('fecha inválida', () => expect(relativeDays('no-es-fecha', NOW)).toBe(''));
});

describe('pendingAgreements', () => {
  it('filtra los completados y ordena del más antiguo al más nuevo', () => {
    const result = pendingAgreements([
      agreement({ id: 1, completado: true, fecha_creacion: daysAgo(1) }),
      agreement({ id: 2, completado: false, fecha_creacion: daysAgo(2) }),
      agreement({ id: 3, completado: false, fecha_creacion: daysAgo(9) }),
    ]);
    expect(result.map(a => a.id)).toEqual([3, 2]);
  });

  it('sin acuerdos pendientes', () => {
    expect(pendingAgreements([agreement({ completado: true })])).toEqual([]);
  });
});

describe('staleObjective', () => {
  it('sin objetivos', () => expect(staleObjective([], NOW)).toBeNull());

  it('objetivo actualizado hace menos de 7 días: no aparece', () => {
    expect(staleObjective([objective({ fecha_actualizacion: daysAgo(6) })], NOW)).toBeNull();
  });

  it('en el límite de 7 días: sí aparece', () => {
    const result = staleObjective([objective({ id: 5, fecha_actualizacion: daysAgo(7) })], NOW);
    expect(result?.id).toBe(5);
  });

  it('con varios, elige el más viejo', () => {
    const result = staleObjective([
      objective({ id: 1, fecha_actualizacion: daysAgo(8) }),
      objective({ id: 2, fecha_actualizacion: daysAgo(20) }),
    ], NOW);
    expect(result?.id).toBe(2);
  });
});

describe('sessionLabel', () => {
  it('formatea día de la semana, mes abreviado y hora', () => {
    const result = sessionLabel({ fecha_sesion: '2026-09-24T17:00:00', titulo: 'Sesión de seguimiento', duracion_minutos: 45 });
    expect(result).toEqual({ when: 'Jueves 24 de sep · 17:00', what: 'Sesión de seguimiento · 45 min' });
  });

  it('fecha inválida: null', () => {
    expect(sessionLabel({ fecha_sesion: 'no-es-fecha', titulo: 'x', duracion_minutos: 30 })).toBeNull();
  });
});

describe('nowCount', () => {
  it('suma acuerdos pendientes, objetivo y sesión', () => expect(nowCount(2, true, true)).toBe(4));
  it('sin objetivo ni sesión', () => expect(nowCount(3, false, false)).toBe(3));
  it('todo en cero', () => expect(nowCount(0, false, false)).toBe(0));
});
