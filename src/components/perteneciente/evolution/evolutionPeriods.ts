import { dayCounts, periodCounts } from './evolutionHelpers';

export type Period = 'day' | 'week' | 'month' | 'quarter' | 'year';

export const PERIODS: readonly Period[] = ['day', 'week', 'month', 'quarter', 'year'];

export interface PeriodConfig {
  label: string;
  hint: string;
  previousLabel: string;
  perWord: 'día' | 'semana';
  // Semanas de la serie semanal (sub-tab Semanas, detalle y PDF). Hoy y
  // Última semana usan las 8 de siempre: no hay serie semanal más corta que sirva.
  weeks: number;
  // Meses calendario para comparar las tarjetas que salen de fechas.
  months?: number;
  // Ventana móvil en días: si está, el resumen sale de la serie diaria.
  days?: number;
}

export const PERIOD_CONFIG: Record<Period, PeriodConfig> = {
  day: { label: 'Hoy', hint: 'Comparamos hoy con ayer.', previousLabel: 'Ayer', perWord: 'día', weeks: 8, days: 1 },
  week: { label: 'Última semana', hint: 'Comparamos los últimos 7 días con los 7 anteriores.', previousLabel: 'Semana pasada', perWord: 'semana', weeks: 8, days: 7 },
  month: { label: 'Este mes', hint: 'Comparamos este mes con el anterior.', previousLabel: 'Mes pasado', perWord: 'semana', weeks: 8, months: 1 },
  quarter: { label: 'Últimos 3 meses', hint: 'Comparamos los últimos 3 meses con los 3 anteriores.', previousLabel: '3 meses antes', perWord: 'semana', weeks: 13, months: 3 },
  year: { label: 'Último año', hint: 'Comparamos el último año con el anterior.', previousLabel: '12 meses antes', perWord: 'semana', weeks: 52, months: 12 },
};

export function countByPeriod(dates: Date[], config: PeriodConfig) {
  return config.days ? dayCounts(dates, config.days) : periodCounts(dates, config.months ?? 1);
}
