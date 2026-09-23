import type { SharedSupportAgreement, SharedSupportNote, SharedSupportObjective } from '@/data/api';
import { MONTHS, WEEKDAYS } from './collaborationHelpers';

export type FeedItem =
  | { kind: 'nota'; date: string; note: SharedSupportNote }
  | { kind: 'acuerdo'; date: string; agreement: SharedSupportAgreement }
  | { kind: 'objetivo'; date: string; objective: SharedSupportObjective };

export type FeedFilter = 'todo' | 'nota' | 'acuerdo' | 'objetivo';

// Unica responsabilidad: juntar notas, acuerdos y objetivos en un solo hilo
// ordenado por fecha (mas nuevo primero). Cada tipo usa la fecha que mejor
// representa "cuando paso esto": creacion para notas y acuerdos, ultima
// actualizacion para objetivos (asi un objetivo completado o con progreso
// nuevo sube al tope, igual que en pantalla).
export function buildFeedItems(notes: SharedSupportNote[], agreements: SharedSupportAgreement[], objectives: SharedSupportObjective[]): FeedItem[] {
  const items: FeedItem[] = [
    ...notes.map(note => ({ kind: 'nota' as const, date: note.fecha_creacion, note })),
    ...agreements.map(agreement => ({ kind: 'acuerdo' as const, date: agreement.fecha_creacion, agreement })),
    ...objectives.map(objective => ({ kind: 'objetivo' as const, date: objective.fecha_actualizacion, objective })),
  ];
  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function matchesFilter(item: FeedItem, filter: FeedFilter): boolean {
  return filter === 'todo' || item.kind === filter;
}

export function isToday(iso: string, now: Date = new Date()): boolean {
  const date = new Date(iso);
  return !Number.isNaN(date.getTime()) && date.toDateString() === now.toDateString();
}

export function dayGroupLabel(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  if (date.toDateString() === now.toDateString()) return 'Hoy';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
  const weekday = WEEKDAYS[date.getDay()];
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

// Etiqueta corta para el horario de cada item dentro de su grupo de dia: hoy
// solo la hora (el grupo ya dice "Hoy"), ayer con "Ayer" + hora, mas viejo
// solo la fecha (sin hora, para no repetir formato de mas arriba en el dia).
export function itemTimeLabel(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  if (isToday(iso, now)) return time;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Ayer ${time}`;
  return dayGroupLabel(iso, now);
}

export function shortDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : `${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

export function groupByDay(items: FeedItem[], now: Date = new Date()): { label: string; items: FeedItem[] }[] {
  const groups: { label: string; items: FeedItem[] }[] = [];
  items.forEach(item => {
    const label = dayGroupLabel(item.date, now);
    const group = groups.find(entry => entry.label === label);
    if (group) group.items.push(item);
    else groups.push({ label, items: [item] });
  });
  return groups;
}
