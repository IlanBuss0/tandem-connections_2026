import type { EmotionalRecord } from '@/data/api';

/** Funciones puras para resumir registros emocionales. Los días son claves locales "YYYY-MM-DD" (el `date` del registro). */

export type DayRecords = Record<string, EmotionalRecord[]>;
export type EmotionCount = { emotion: string; emoji: string; count: number; share: number };

export const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const MAX_WEEKS_BACK = 6;
export const MAX_MONTHS_BACK = 3;

const toUtc = (key: string) => {
  const [year, month, day] = key.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
};
const fromUtc = (time: number) => new Date(time).toISOString().slice(0, 10);

export const addDays = (key: string, days: number) => fromUtc(toUtc(key) + days * 86_400_000);
export const dayNumber = (key: string) => Number(key.slice(8, 10));
export const weekdayIndex = (key: string) => new Date(toUtc(key)).getUTCDay();

/** Minutos desde medianoche de "14:30" o "02:30 p. m."; 0 si no se entiende. */
function minutesOf(timestamp: string) {
  const match = /(\d{1,2}):(\d{2})\s*([ap])?/i.exec(timestamp || '');
  if (!match) return 0;
  const hours = match[3] ? Number(match[1]) % 12 + (match[3].toLowerCase() === 'p' ? 12 : 0) : Number(match[1]);
  return hours * 60 + Number(match[2]);
}

/** Agrupa por día; dentro de cada día, del primer al último registro (por hora). */
export function groupByDay(records: EmotionalRecord[]): DayRecords {
  const groups: DayRecords = {};
  records.forEach(record => { (groups[record.date] ||= []).push(record); });
  Object.values(groups).forEach(list => list.sort((a, b) => minutesOf(a.timestamp) - minutesOf(b.timestamp)));
  return groups;
}

export const lastOfDay = (list: EmotionalRecord[] | undefined) => list?.[list.length - 1];

/** Semana de 7 días que termina `offset` semanas antes de hoy (0 = últimos 7 días). */
export const weekDays = (today: string, offset: number) => {
  const end = addDays(today, -7 * offset);
  return Array.from({ length: 7 }, (_, i) => addDays(end, i - 6));
};

export function weekLabel(days: string[], offset: number) {
  if (offset === 0) return 'Últimos 7 días';
  const [from, to] = [days[0], days[6]];
  const short = (key: string) => `${dayNumber(key)} ${MONTHS_SHORT[Number(key.slice(5, 7)) - 1]}`;
  return from.slice(5, 7) === to.slice(5, 7) ? `${dayNumber(from)} – ${short(to)}` : `${short(from)} – ${short(to)}`;
}

/** Mes calendario `offset` meses antes del de hoy. */
export function monthOf(today: string, offset: number) {
  const index = Number(today.slice(0, 4)) * 12 + Number(today.slice(5, 7)) - 1 - offset;
  const year = Math.floor(index / 12);
  const month = index % 12;
  const first = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const length = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const days = Array.from({ length }, (_, i) => addDays(first, i));
  return { days, label: `${MONTHS[month]} ${year}` };
}

/** Celdas de calendario con lunes como primer día; null = hueco. */
export function monthCells(days: string[]) {
  const lead = (weekdayIndex(days[0]) + 6) % 7;
  return [...Array<null>(lead).fill(null), ...days];
}

export const countDaysWithRecord = (days: string[], byDay: DayRecords) => days.filter(day => byDay[day]?.length).length;
export const countRecords = (days: string[], byDay: DayRecords) => days.reduce((total, day) => total + (byDay[day]?.length ?? 0), 0);

/** Conteo por emoción, de la más elegida a la menos; en empate, gana la más reciente. */
export function emotionDistribution(days: string[], byDay: DayRecords): EmotionCount[] {
  const records = [...days].reverse().flatMap(day => [...(byDay[day] ?? [])].reverse());
  const counts = new Map<string, EmotionCount>();
  records.forEach(record => {
    const current = counts.get(record.emotion);
    if (current) current.count += 1;
    else counts.set(record.emotion, { emotion: record.emotion, emoji: record.emoji || '🙂', count: 1, share: 0 });
  });
  return [...counts.values()]
    .map(item => ({ ...item, share: item.count / records.length }))
    .sort((a, b) => b.count - a.count);
}

export function dayTitle(day: string, today: string) {
  const label = `${WEEKDAYS[weekdayIndex(day)]} ${dayNumber(day)} ${MONTHS_SHORT[Number(day.slice(5, 7)) - 1]}`;
  if (day === today) return `Hoy, ${label}`;
  if (day === addDays(today, -1)) return `Ayer, ${label}`;
  return label;
}
