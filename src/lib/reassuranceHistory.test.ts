import { describe, expect, it } from "vitest";
import { buildReassuranceMessage } from "@/lib/reassuranceHistory";
import type { CalendarEvent, EmotionalRecord } from "@/data/api";

function calEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return { id: '1', title: 'médico', date: '2026-01-01', time: '10:00', type: 'médico', description: '', userId: 'u1', color: '#fff', ...overrides };
}

function emotion(overrides: Partial<EmotionalRecord> = {}): EmotionalRecord {
  return { id: '1', userId: 'u1', emotion: 'Contento', emoji: '😊', intensity: 3, context: '', whatHelped: '', timestamp: '10:00', date: '2026-01-01', ...overrides };
}

describe("buildReassuranceMessage", () => {
  it("sin eventos pasados, no dice nada (nunca miente con 0 veces)", () => {
    expect(buildReassuranceMessage([], [])).toBeNull();
  });

  it("con eventos pasados pero sin emociones registradas, solo cuenta las veces", () => {
    const msg = buildReassuranceMessage([calEvent(), calEvent({ id: '2', date: '2026-01-05' })], []);
    expect(msg).toContain('2 veces');
    expect(msg).not.toContain('bien');
  });

  it("con mayoria de emociones positivas el mismo dia, agrega la tranquilidad", () => {
    const events = [calEvent({ date: '2026-01-01' }), calEvent({ id: '2', date: '2026-01-05' })];
    const emotions = [emotion({ date: '2026-01-01', emotion: 'Contento' }), emotion({ date: '2026-01-05', emotion: 'Tranquilo' })];
    const msg = buildReassuranceMessage(events, emotions);
    expect(msg).toContain('en general te fue bien');
  });

  it("con mayoria de emociones negativas, no afirma que salio bien", () => {
    const events = [calEvent({ date: '2026-01-01' })];
    const emotions = [emotion({ date: '2026-01-01', emotion: 'Ansioso' })];
    const msg = buildReassuranceMessage(events, emotions);
    expect(msg).not.toContain('bien');
  });

  it("1 vez usa singular", () => {
    const msg = buildReassuranceMessage([calEvent()], []);
    expect(msg).toContain('1 vez.');
  });
});
