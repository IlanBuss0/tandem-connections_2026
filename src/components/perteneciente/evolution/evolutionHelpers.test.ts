import { describe, expect, it } from 'vitest';
import type { EmotionalRecord } from '@/data/api';
import { buildOverviewSummary, describeChange, emotionCounts, periodCounts } from './evolutionHelpers';

function emotion(overrides: Partial<EmotionalRecord> = {}): EmotionalRecord {
  return { id: '1', userId: 'u1', emotion: 'Contento', emoji: '😊', intensity: 3, context: '', whatHelped: '', timestamp: '10:00', date: '2026-01-01', ...overrides };
}

describe('buildOverviewSummary', () => {
  it('avances y apoyo: usa la frase del diseño', () => {
    const summary = buildOverviewSummary([1, 1, -1, 0]);
    expect(summary.phrase).toBe('Vemos avances y un área que pide un poco más de apoyo.');
    expect(summary.good).toBe(2);
    expect(summary.same).toBe(1);
    expect(summary.support).toBe(1);
  });

  it('varios que necesitan apoyo, pluraliza la frase', () => {
    const summary = buildOverviewSummary([1, -1, -1]);
    expect(summary.phrase).toBe('Vemos avances y 2 áreas que piden un poco más de apoyo.');
  });

  it('solo mejoras, sin apoyo', () => {
    expect(buildOverviewSummary([1]).phrase).toBe('Vemos un avance.');
    expect(buildOverviewSummary([1, 1]).phrase).toBe('Vemos avances.');
  });

  it('solo apoyo, sin mejoras', () => {
    expect(buildOverviewSummary([-1]).phrase).toBe('Hay un área que pide un poco más de apoyo.');
    expect(buildOverviewSummary([-1, -1]).phrase).toBe('Hay áreas que piden un poco más de apoyo.');
  });

  it('todo estable', () => {
    expect(buildOverviewSummary([0, 0]).phrase).toBe('Por ahora, se mantiene estable.');
  });

  it('sin datos (todo null) no cuenta nada', () => {
    const summary = buildOverviewSummary([null, null]);
    expect(summary.good).toBe(0);
    expect(summary.same).toBe(0);
    expect(summary.support).toBe(0);
    expect(summary.phrase).toBe('Todavía no hay suficientes datos para armar un resumen.');
  });

  it('la leyenda usa singular y plural correctos', () => {
    const summary = buildOverviewSummary([1, 0, 0, -1]);
    expect(summary.legend.good).toBe('1 área mejoró');
    expect(summary.legend.same).toBe('2 se mantienen');
    expect(summary.legend.support).toBe('1 pide un poco más de apoyo');
  });
});

describe('emotionCounts', () => {
  it('cuenta y ordena de mayor a menor, hasta 4', () => {
    const records = [
      emotion({ emotion: 'Contento' }),
      emotion({ emotion: 'Contento' }),
      emotion({ emotion: 'Triste', emoji: '😢' }),
      emotion({ emotion: 'Ansioso', emoji: '😰' }),
      emotion({ emotion: 'Cansado', emoji: '😴' }),
      emotion({ emotion: 'Feliz', emoji: '😄' }),
    ];
    const counts = emotionCounts(records);
    expect(counts).toHaveLength(4);
    expect(counts[0]).toEqual({ emotion: 'Contento', emoji: '😊', count: 2 });
  });

  it('sin registros, devuelve vacío', () => {
    expect(emotionCounts([])).toEqual([]);
  });
});

describe('describeChange', () => {
  it('pasos de rutina en alza', () => {
    expect(describeChange('steps', 6, 14, 5)).toBe('Fue subiendo: de 6 a 14 pasos en 5 semanas.');
  });

  it('pasos de rutina en baja', () => {
    expect(describeChange('steps', 14, 6, 5)).toBe('Fue bajando: de 14 a 6 pasos en 5 semanas.');
  });

  it('pasos de rutina estables', () => {
    expect(describeChange('steps', 10, 10, 3)).toBe('Se mantuvo estable: 10 pasos por semana en 3 semanas.');
  });

  it('animo positivo, en porcentaje, sin sufijo de semanas', () => {
    expect(describeChange('mood', 48, 58, 5)).toBe('Pasó de 48% a 58% de registros positivos.');
  });
});

describe('periodCounts', () => {
  const monthsAgo = (n: number) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - n); return d; };

  it('months=1 se comporta como el monthCounts original: mes actual vs. el anterior', () => {
    const dates = [monthsAgo(0), monthsAgo(0), monthsAgo(1), monthsAgo(2)];
    expect(periodCounts(dates, 1)).toEqual({ thisMonth: 2, lastMonth: 1 });
  });

  it('months=3 compara los últimos 3 meses calendario contra los 3 anteriores', () => {
    const dates = [monthsAgo(0), monthsAgo(1), monthsAgo(2), monthsAgo(3), monthsAgo(4), monthsAgo(5), monthsAgo(6)];
    expect(periodCounts(dates, 3)).toEqual({ thisMonth: 3, lastMonth: 3 });
  });

  it('sin fechas, ambos períodos dan 0', () => {
    expect(periodCounts([], 3)).toEqual({ thisMonth: 0, lastMonth: 0 });
  });
});
