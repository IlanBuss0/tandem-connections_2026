import { describe, expect, it } from "vitest";
import { countEventsByDate, isDayOverloaded } from "@/lib/weekLoad";
import type { CalendarEvent } from "@/data/api";

function ev(date: string, id: string): CalendarEvent {
  return { id, title: 't', date, time: '10:00', type: 'x', description: '', userId: 'u1', color: '#fff' };
}

describe("weekLoad", () => {
  it("countEventsByDate agrupa por fecha", () => {
    const counts = countEventsByDate([ev('2026-01-01', 'a'), ev('2026-01-01', 'b'), ev('2026-01-02', 'c')]);
    expect(counts.get('2026-01-01')).toBe(2);
    expect(counts.get('2026-01-02')).toBe(1);
  });

  it("isDayOverloaded es false con pocos eventos", () => {
    const events = [ev('2026-01-01', 'a'), ev('2026-01-01', 'b')];
    expect(isDayOverloaded(events, '2026-01-01')).toBe(false);
  });

  it("isDayOverloaded es true con 4 o mas eventos el mismo dia", () => {
    const events = ['a', 'b', 'c', 'd'].map((id) => ev('2026-01-01', id));
    expect(isDayOverloaded(events, '2026-01-01')).toBe(true);
  });
});
