import { describe, expect, it } from 'vitest';
import type { SharedSupportAgreement, SharedSupportNote, SharedSupportObjective } from '@/data/api';
import { buildFeedItems, dayGroupLabel, groupByDay, isToday, itemTimeLabel, matchesFilter, shortDate } from './feedHelpers';

const NOW = new Date('2026-09-23T15:00:00');
const daysAgo = (days: number, hours = 10) => {
  const date = new Date(NOW);
  date.setDate(date.getDate() - days);
  date.setHours(hours, 20, 0, 0);
  return date.toISOString();
};

const note = (overrides: Partial<SharedSupportNote> = {}): SharedSupportNote =>
  ({ id: 1, id_perteneciente: 1, id_usuario_autor: 1, contenido: 'x', fecha_creacion: daysAgo(0), fecha_actualizacion: daysAgo(0), ...overrides });
const agreement = (overrides: Partial<SharedSupportAgreement> = {}): SharedSupportAgreement =>
  ({ id: 1, id_perteneciente: 1, id_usuario_creador: 1, texto: 'x', completado: false, fecha_creacion: daysAgo(1), fecha_actualizacion: daysAgo(1), ...overrides });
const objective = (overrides: Partial<SharedSupportObjective> = {}): SharedSupportObjective =>
  ({ id: 1, id_perteneciente: 1, id_usuario_creador: 1, titulo: 'x', descripcion: null, estado: 'activo', progreso: 50, fecha_creacion: daysAgo(5), fecha_actualizacion: daysAgo(5), ...overrides });

describe('buildFeedItems', () => {
  it('junta los 3 tipos y ordena del mas nuevo al mas viejo', () => {
    const items = buildFeedItems([note({ id: 1, fecha_creacion: daysAgo(2) })], [agreement({ id: 1, fecha_creacion: daysAgo(0) })], [objective({ id: 1, fecha_actualizacion: daysAgo(1) })]);
    expect(items.map(item => item.kind)).toEqual(['acuerdo', 'objetivo', 'nota']);
  });
});

describe('matchesFilter', () => {
  const item = { kind: 'nota' as const, date: daysAgo(0), note: note() };
  it('todo matchea cualquier tipo', () => expect(matchesFilter(item, 'todo')).toBe(true));
  it('un filtro especifico solo matchea su tipo', () => {
    expect(matchesFilter(item, 'nota')).toBe(true);
    expect(matchesFilter(item, 'acuerdo')).toBe(false);
  });
});

describe('isToday', () => {
  it('hoy es true', () => expect(isToday(daysAgo(0), NOW)).toBe(true));
  it('ayer es false', () => expect(isToday(daysAgo(1), NOW)).toBe(false));
});

describe('dayGroupLabel', () => {
  it('hoy', () => expect(dayGroupLabel(daysAgo(0), NOW)).toBe('Hoy'));
  it('ayer', () => expect(dayGroupLabel(daysAgo(1), NOW)).toBe('Ayer'));
  it('mas viejo: dia de la semana + fecha', () => expect(dayGroupLabel(daysAgo(9), NOW)).toBe('Lunes 14 de sep'));
  it('fecha invalida', () => expect(dayGroupLabel('no-es-fecha', NOW)).toBe(''));
});

describe('itemTimeLabel', () => {
  it('hoy: solo la hora', () => expect(itemTimeLabel(daysAgo(0, 10), NOW)).toBe('10:20'));
  it('ayer: Ayer + hora', () => expect(itemTimeLabel(daysAgo(1, 21), NOW)).toBe('Ayer 21:20'));
  it('mas viejo: la fecha, sin hora', () => expect(itemTimeLabel(daysAgo(9), NOW)).toBe('Lunes 14 de sep'));
});

describe('shortDate', () => {
  it('dia + mes abreviado', () => expect(shortDate(daysAgo(20))).toBe('3 de sep'));
});

describe('groupByDay', () => {
  it('agrupa items del mismo dia bajo la misma etiqueta', () => {
    const items = buildFeedItems([note({ id: 1, fecha_creacion: daysAgo(0, 9) }), note({ id: 2, fecha_creacion: daysAgo(0, 18) })], [], []);
    const groups = groupByDay(items, NOW);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ label: 'Hoy' });
    expect(groups[0].items).toHaveLength(2);
  });
});
