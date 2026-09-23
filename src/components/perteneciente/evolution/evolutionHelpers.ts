import type { EmotionalRecord } from '@/data/api';
import type { EvolutionWeek } from '@/data/usageApi';
import type { EvolutionSummary } from './useEvolutionSummary';

export const activityIsDone = (item: { completed?: boolean; status?: string }) =>
  item.completed ?? /^completad/i.test(String(item.status ?? ''));

export function trendDirection(delta: number, threshold: number): 1 | 0 | -1 {
  if (delta > threshold) return 1;
  if (delta < -threshold) return -1;
  return 0;
}

// Mismo texto que ve el badge en pantalla (TrendBadge) y el que se imprime
// en el PDF de "Llevar un resumen" — una sola fuente para no duplicar copy.
export function trendLabel(direction: 1 | 0 | -1 | null): string {
  if (direction === null) return 'Sin datos aún';
  if (direction === 1) return 'Mejoró';
  if (direction === -1) return 'Necesita más apoyo';
  return 'Se mantiene';
}

// `months = 1` ("Este mes"): mes calendario actual contra el anterior,
// igual que el monthCounts original. `months = 3` ("Últimos 3 meses",
// Prompt 2): últimos 3 meses calendario contra los 3 anteriores.
export function periodCounts(dates: Date[], months: number) {
  const now = new Date();
  const monthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth();
  const current = monthIndex(now);
  const diffInRange = (date: Date, min: number, max: number) => {
    const diff = current - monthIndex(date);
    return diff >= min && diff <= max;
  };
  const thisMonth = dates.filter(date => diffInRange(date, 0, months - 1)).length;
  const lastMonth = dates.filter(date => diffInRange(date, months, months * 2 - 1)).length;
  return { thisMonth, lastMonth };
}

export function mostFrequentEmotion(records: EmotionalRecord[]) {
  if (!records.length) return null;
  const counts = new Map<string, number>();
  records.forEach(record => counts.set(record.emotion, (counts.get(record.emotion) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export function isoWeekStart(isoWeek: string): Date | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(isoWeek);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday1 = new Date(jan4);
  monday1.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  const start = new Date(monday1);
  start.setUTCDate(monday1.getUTCDate() + (week - 1) * 7);
  return start;
}

export interface EmotionCount { emotion: string; emoji: string; count: number }

export function emotionCounts(records: EmotionalRecord[]): EmotionCount[] {
  const byEmotion = new Map<string, EmotionCount>();
  records.forEach(record => {
    const existing = byEmotion.get(record.emotion);
    if (existing) existing.count += 1;
    else byEmotion.set(record.emotion, { emotion: record.emotion, emoji: record.emoji || '🙂', count: 1 });
  });
  return [...byEmotion.values()].sort((a, b) => b.count - a.count).slice(0, 4);
}

export interface OverviewSummary {
  eyebrow: string;
  phrase: string;
  good: number;
  same: number;
  support: number;
  legend: { good: string; same: string; support: string };
}

const pluralize = (count: number, singular: string, plural: string) => (count === 1 ? singular : plural);

export function buildOverviewSummary(directions: (1 | 0 | -1 | null)[]): OverviewSummary {
  const good = directions.filter(direction => direction === 1).length;
  const same = directions.filter(direction => direction === 0).length;
  const support = directions.filter(direction => direction === -1).length;

  let phrase = 'Todavía no hay suficientes datos para armar un resumen.';
  if (good > 0 && support > 0) {
    phrase = support === 1
      ? 'Vemos avances y un área que pide un poco más de apoyo.'
      : `Vemos avances y ${support} áreas que piden un poco más de apoyo.`;
  } else if (good > 0) {
    phrase = pluralize(good, 'Vemos un avance.', 'Vemos avances.');
  } else if (support > 0) {
    phrase = pluralize(support, 'Hay un área que pide un poco más de apoyo.', 'Hay áreas que piden un poco más de apoyo.');
  } else if (same > 0) {
    phrase = 'Por ahora, se mantiene estable.';
  }

  return {
    eyebrow: 'Un vistazo',
    phrase,
    good,
    same,
    support,
    legend: {
      good: `${good} ${pluralize(good, 'área mejoró', 'áreas mejoraron')}`,
      same: `${same} ${pluralize(same, 'se mantiene', 'se mantienen')}`,
      support: `${support} ${pluralize(support, 'pide', 'piden')} un poco más de apoyo`,
    },
  };
}

export function describeChange(unit: 'steps' | 'mood', from: number, to: number, weeksCount: number): string {
  const roundedFrom = Math.round(from);
  const roundedTo = Math.round(to);
  if (unit === 'mood') return `Pasó de ${roundedFrom}% a ${roundedTo}% de registros positivos.`;
  const weeksLabel = `${weeksCount} ${pluralize(weeksCount, 'semana', 'semanas')}`;
  const trend = roundedTo > roundedFrom ? 'subiendo' : roundedTo < roundedFrom ? 'bajando' : 'estable';
  if (trend === 'estable') return `Se mantuvo estable: ${roundedTo} pasos por semana en ${weeksLabel}.`;
  return `Fue ${trend}: de ${roundedFrom} a ${roundedTo} pasos en ${weeksLabel}.`;
}

export interface EvolutionCopy {
  stepsDirection: 1 | 0 | -1 | null;
  moodDirection: 1 | 0 | -1 | null;
  autonomyBefore: string;
  autonomyAfter: string;
  participationBefore: string;
  participationAfter: string;
}

// Compartido entre la tab Resumen (siempre 8 semanas) y la sub-tab Cambios
// de Evolución (8 o 13 semanas según el período elegido, Prompt 2): mismo
// cálculo de dirección y texto "antes/ahora", solo cambia cuántas semanas
// trae `evolution`.
export function buildEvolutionCopy(evolution: EvolutionSummary, activitiesCount: number): EvolutionCopy {
  const withoutData = {
    stepsDirection: null as 1 | 0 | -1 | null,
    moodDirection: null as 1 | 0 | -1 | null,
    autonomyBefore: 'Todavía no había suficientes semanas registradas para comparar.',
    autonomyAfter: 'Todavía no hay pasos de rutina registrados para calcular esto.',
    participationBefore: 'Todavía no había suficientes registros emocionales para comparar.',
    participationAfter: activitiesCount ? `Hay ${activitiesCount} actividades que nos ayudan a observar su recorrido.` : 'Todavía no hay actividades ni emociones compartidas.',
  };
  if (!evolution.hasData) return withoutData;

  const { recentSteps, earlierSteps, recentMood, earlierMood } = evolution;
  const stepsDirection = earlierSteps !== null && recentSteps !== null ? trendDirection(recentSteps - earlierSteps, 0.5) : null;
  const moodDirection = earlierMood !== null && recentMood !== null ? trendDirection((recentMood - earlierMood) * 100, 5) : null;

  return {
    stepsDirection,
    moodDirection,
    autonomyBefore: earlierSteps !== null
      ? `Hace unas semanas hacía unos ${Math.round(earlierSteps)} pasos de rutina por semana.`
      : 'Todavía no había suficientes semanas registradas para comparar.',
    autonomyAfter: recentSteps !== null
      ? `Ahora hace unos ${Math.round(recentSteps)} por semana${stepsDirection !== null ? ` — ${stepsDirection > 0 ? 'un poco más' : stepsDirection < 0 ? 'un poco menos' : 'más o menos igual'} que antes` : ''}.`
      : 'Todavía no hay pasos de rutina registrados para calcular esto.',
    participationBefore: earlierMood !== null
      ? `Hace unas semanas, ${Math.round(earlierMood * 10)} de cada 10 registros emocionales eran positivos.`
      : 'Todavía no había suficientes registros emocionales para comparar.',
    participationAfter: recentMood !== null
      ? `Ahora, ${Math.round(recentMood * 10)} de cada 10 son positivos${moodDirection !== null ? ` — ${moodDirection > 0 ? 'más que antes' : moodDirection < 0 ? 'menos que antes' : 'igual que antes'}` : ''}.`
      : activitiesCount ? `Hay ${activitiesCount} actividades que nos ayudan a observar su recorrido.` : 'Todavía no hay actividades ni emociones compartidas.',
  };
}

export type { EvolutionWeek };
