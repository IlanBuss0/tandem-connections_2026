import { describe, expect, it } from 'vitest';
import type { RoutineItem } from '@/data/mockData';
import { localDateKey, resetStaleCompletions } from './routineDay';

const item = (id: string, extra: Partial<RoutineItem> = {}): RoutineItem => ({ id, time: '08:00', title: id, icon: '', completed: false, category: 'mañana', ...extra });
const routine = (items: RoutineItem[], id = 'r1') => ({ id, name: 'Mi mañana', dayOfWeek: 1 as const, items });
const TODAY = '2026-10-06';

describe('localDateKey', () => {
  it('usa la hora local (no UTC) con meses y días de dos dígitos', () => {
    expect(localDateKey(new Date(2026, 0, 5, 9, 0))).toBe('2026-01-05');
    // 23:59 locales: en Argentina (UTC-3) en UTC ya es el día siguiente, pero el día local es el 6.
    expect(localDateKey(new Date(2026, 9, 6, 23, 59))).toBe('2026-10-06');
    expect(localDateKey(new Date(2026, 9, 7, 0, 1))).toBe('2026-10-07');
  });

  it('sin argumento devuelve el día de hoy', () => {
    expect(localDateKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('resetStaleCompletions', () => {
  it('el paso completado hoy queda hecho', () => {
    const routines = [routine([item('a', { completed: true, completedOn: TODAY })])];
    const result = resetStaleCompletions(routines, TODAY);
    expect(result[0].items[0]).toMatchObject({ completed: true, completedOn: TODAY });
  });

  it('el paso completado otro día se reinicia', () => {
    const [result] = resetStaleCompletions([routine([item('a', { completed: true, completedOn: '2026-10-05' })])], TODAY);
    expect(result.items[0].completed).toBe(false);
    expect(result.items[0].completedOn).toBeUndefined();
  });

  it('el paso hecho sin fecha (dato viejo) se reinicia', () => {
    const [result] = resetStaleCompletions([routine([item('a', { completed: true })])], TODAY);
    expect(result.items[0].completed).toBe(false);
  });

  it('reinicia solo lo viejo: conserva lo de hoy y lo pendiente, y no toca el resto de los campos', () => {
    const [result] = resetStaleCompletions([routine([
      item('hoy', { completed: true, completedOn: TODAY, reminders: [5] }),
      item('ayer', { completed: true, completedOn: '2026-10-05', pictogramId: 'p1' }),
      item('pendiente'),
    ])], TODAY);
    expect(result.items.map((it) => it.completed)).toEqual([true, false, false]);
    expect(result.items[1].pictogramId).toBe('p1');
    expect(result.items[0].reminders).toEqual([5]);
  });

  it('sin nada que reiniciar devuelve el mismo array (misma referencia)', () => {
    const routines = [routine([item('a', { completed: true, completedOn: TODAY }), item('b')])];
    expect(resetStaleCompletions(routines, TODAY)).toBe(routines);
    const empty: ReturnType<typeof routine>[] = [];
    expect(resetStaleCompletions(empty, TODAY)).toBe(empty);
  });

  it('si algo cambia, devuelve un array nuevo y conserva las rutinas sin cambios', () => {
    const untouched = routine([item('a')], 'r1');
    const stale = routine([item('b', { completed: true, completedOn: '2026-10-01' })], 'r2');
    const result = resetStaleCompletions([untouched, stale], TODAY);
    expect(result).not.toEqual([untouched, stale]);
    expect(result[0]).toBe(untouched);
    expect(result[1].items[0].completed).toBe(false);
  });
});
