import { describe, expect, it } from 'vitest';
import type { EmotionalRecord } from '@/data/api';
import {
  addDays, countDaysWithRecord, countRecords, dayTitle, emotionDistribution, groupByDay, lastOfDay, monthCells, monthOf, weekDays, weekLabel,
} from './emotionSummary';

const TODAY = '2026-09-30'; // miércoles
let seq = 0;
const rec = (date: string, emotion: string, timestamp = '10:00', over: Partial<EmotionalRecord> = {}): EmotionalRecord => ({
  id: String(++seq), userId: '1', emotion, emoji: emotion === 'Contento' ? '😊' : '😰', intensity: 3, context: '', whatHelped: '', timestamp, date, ...over,
});

describe('groupByDay', () => {
  it('agrupa por día y ordena por hora, el último registro del día es el más tarde', () => {
    const byDay = groupByDay([rec(TODAY, 'Ansioso', '18:00'), rec(TODAY, 'Contento', '08:30'), rec('2026-09-29', 'Contento')]);
    expect(byDay[TODAY].map(r => r.timestamp)).toEqual(['08:30', '18:00']);
    expect(lastOfDay(byDay[TODAY])?.emotion).toBe('Ansioso');
    expect(lastOfDay(byDay['2026-09-01'])).toBeUndefined();
  });

  it('entiende horas con a. m. / p. m.', () => {
    const byDay = groupByDay([rec(TODAY, 'A', '02:30 p. m.'), rec(TODAY, 'B', '11:15 a. m.'), rec(TODAY, 'C', '12:05 a. m.')]);
    expect(byDay[TODAY].map(r => r.emotion)).toEqual(['C', 'B', 'A']);
  });
});

describe('semana', () => {
  it('la semana actual son los últimos 7 días y termina hoy', () => {
    const days = weekDays(TODAY, 0);
    expect(days).toHaveLength(7);
    expect(days[0]).toBe('2026-09-24');
    expect(days[6]).toBe(TODAY);
    expect(weekLabel(days, 0)).toBe('Últimos 7 días');
  });

  it('semanas anteriores: rango de fechas, cruzando de mes', () => {
    expect(weekLabel(weekDays(TODAY, 1), 1)).toBe('17 – 23 sep');
    expect(weekLabel(weekDays(TODAY, 2), 2)).toBe('10 – 16 sep');
    expect(weekLabel(weekDays('2026-10-03', 1), 1)).toBe('20 – 26 sep');
    expect(weekLabel(weekDays('2026-10-05', 0), 1)).toBe('29 sep – 5 oct');
  });
});

describe('mes', () => {
  it('devuelve los días del mes y su nombre, también para meses anteriores y cambio de año', () => {
    const sept = monthOf(TODAY, 0);
    expect(sept.label).toBe('septiembre 2026');
    expect(sept.days).toHaveLength(30);
    expect(monthOf('2026-01-15', 1)).toMatchObject({ label: 'diciembre 2025' });
    expect(monthOf('2026-03-10', 1).days).toHaveLength(28);
  });

  it('el calendario arranca en lunes (septiembre 2026 empieza un martes)', () => {
    const cells = monthCells(monthOf(TODAY, 0).days);
    expect(cells.slice(0, 2)).toEqual([null, '2026-09-01']);
    expect(monthCells(monthOf('2026-06-10', 0).days)[0]).toBe('2026-06-01'); // junio 2026 empieza un lunes
  });
});

describe('números del período', () => {
  const byDay = groupByDay([
    rec(TODAY, 'Contento', '09:00'), rec(TODAY, 'Ansioso', '15:00'), rec('2026-09-29', 'Contento'), rec('2026-09-20', 'Contento'),
  ]);
  const week = weekDays(TODAY, 0);

  it('cuenta días con registro y registros del período visible', () => {
    expect(countDaysWithRecord(week, byDay)).toBe(2);
    expect(countRecords(week, byDay)).toBe(3);
    expect(countRecords(weekDays(TODAY, 1), byDay)).toBe(1);
    expect(countDaysWithRecord(weekDays(TODAY, 3), byDay)).toBe(0);
  });

  it('emoción más elegida y distribución con porcentajes', () => {
    const distribution = emotionDistribution(week, byDay);
    expect(distribution[0]).toMatchObject({ emotion: 'Contento', emoji: '😊', count: 2 });
    expect(distribution[0].share).toBeCloseTo(2 / 3);
    expect(distribution.map(item => item.count)).toEqual([2, 1]);
  });

  it('en empate gana la emoción más reciente', () => {
    const tied = groupByDay([rec('2026-09-28', 'Contento'), rec(TODAY, 'Ansioso')]);
    expect(emotionDistribution(week, tied)[0].emotion).toBe('Ansioso');
  });

  it('sin registros no hay distribución', () => {
    expect(emotionDistribution(week, {})).toEqual([]);
  });
});

describe('dayTitle', () => {
  it('Hoy, Ayer y días anteriores', () => {
    expect(dayTitle(TODAY, TODAY)).toBe('Hoy, miércoles 30 sep');
    expect(dayTitle('2026-09-29', TODAY)).toBe('Ayer, martes 29 sep');
    expect(dayTitle('2026-09-28', TODAY)).toBe('lunes 28 sep');
  });

  it('addDays cruza meses', () => {
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30');
  });
});
