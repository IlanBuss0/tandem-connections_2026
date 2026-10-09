import type { RoutineItem } from '@/data/mockData';

const pad = (value: number) => String(value).padStart(2, '0');

/** Día de hoy como YYYY-MM-DD en HORA LOCAL (no UTC: de noche en Argentina UTC ya es el día siguiente). */
export function localDateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const isStale = (item: RoutineItem, todayKey: string) => item.completed && item.completedOn !== todayKey;

/**
 * Un paso completado cuenta como hecho solo el día en que se completó: todo
 * paso hecho cuyo `completedOn` no sea hoy (o no tenga fecha, dato viejo) vuelve
 * a "sin completar". Si no hay nada que reiniciar devuelve el MISMO array (misma
 * referencia), para no disparar un guardado de más.
 */
export function resetStaleCompletions<R extends { items: RoutineItem[] }>(routines: R[], todayKey: string): R[] {
  let changed = false;
  const next = routines.map((routine) => {
    if (!routine.items.some((item) => isStale(item, todayKey))) return routine;
    changed = true;
    return {
      ...routine,
      items: routine.items.map((item) => (isStale(item, todayKey) ? { ...item, completed: false, completedOn: undefined } : item)),
    };
  });
  return changed ? next : routines;
}
