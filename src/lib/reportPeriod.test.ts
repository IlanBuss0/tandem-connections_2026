import { describe, expect, it } from 'vitest';
import type { GeneratedReport } from '@/data/api';
import { periodDates, reportsInPeriod } from '@/lib/reportPeriod';

const NOW = Date.parse('2026-10-01T12:00:00');
const make = (id: number, person: number, sent: string | null, generated: string) =>
  ({ id, id_perteneciente: person, fecha_envio: sent, fecha_generacion: generated }) as GeneratedReport;
const reports = [
  make(1, 7, null, '2026-09-28T10:00:00'),
  make(2, 7, '2026-09-05T10:00:00', '2026-08-01T10:00:00'),
  make(3, 7, null, '2025-01-10T10:00:00'),
  make(4, 8, null, '2026-09-28T10:00:00'),
];
const none = { from: '', to: '' };
const ids = (list: GeneratedReport[]) => list.map((r) => r.id);

describe('reportsInPeriod', () => {
  it('filtra por persona y ordena del más viejo al más nuevo', () => {
    expect(ids(reportsInPeriod(reports, 7, 'all', none, NOW))).toEqual([3, 2, 1]);
  });
  it('usa fecha_envio si existe y si no fecha_generacion', () => {
    expect(ids(reportsInPeriod(reports, 7, 'month', none, NOW))).toEqual([2, 1]);
    expect(ids(reportsInPeriod(reports, 7, 'week', none, NOW))).toEqual([1]);
    expect(ids(reportsInPeriod(reports, 7, 'year', none, NOW))).toEqual([2, 1]);
  });
  it('rango personalizado inclusivo', () => {
    expect(ids(reportsInPeriod(reports, 7, 'custom', { from: '2026-09-05', to: '2026-09-28' }, NOW))).toEqual([2, 1]);
    expect(ids(reportsInPeriod(reports, 7, 'custom', { from: '2026-09-06', to: '2026-09-27' }, NOW))).toEqual([]);
  });
});

describe('periodDates', () => {
  it('devuelve desde/hasta o null', () => {
    expect(periodDates('all', none, NOW)).toBeNull();
    expect(periodDates('custom', { from: '2026-09-01', to: '' }, NOW)).toBeNull();
    expect(periodDates('week', none, NOW)).toEqual({ from: '2026-09-24', to: '2026-10-01' });
  });
});
