import type { CalendarEvent } from '@/data/api';

// Unica responsabilidad: detectar si un dia esta sobrecargado de eventos
// (Sesion 17, item 23). Puro — cuenta, no decide que hacer con eso.
//
// Umbral fijo (4) en vez de configurable: es un apoyo simple, no una
// feature de configuracion. Si con el tiempo resulta que el umbral esta
// mal calibrado para el uso real, se ajusta el numero, no se construye un
// setting para algo que todavia nadie pidio poder ajustar.
const OVERLOADED_THRESHOLD = 4;

export function countEventsByDate(events: CalendarEvent[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const event of events) {
    counts.set(event.date, (counts.get(event.date) || 0) + 1);
  }
  return counts;
}

export function isDayOverloaded(events: CalendarEvent[], date: string): boolean {
  return events.filter((e) => e.date === date).length >= OVERLOADED_THRESHOLD;
}
