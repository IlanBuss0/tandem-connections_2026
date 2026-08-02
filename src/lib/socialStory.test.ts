import { describe, expect, it } from "vitest";
import { buildSocialStoryPhrases } from "@/lib/socialStory";
import type { CalendarEvent } from "@/data/api";

function event(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: '1', title: 'ir al médico', date: '2026-01-04', time: '10:00',
    type: 'médico', description: '', userId: 'u1', color: '#fff',
    ...overrides,
  };
}

describe("buildSocialStoryPhrases", () => {
  const now = new Date(2026, 0, 1, 9, 0);

  it("arma la secuencia base: que, cuando, tranquilidad, despues", () => {
    const phrases = buildSocialStoryPhrases(event(), now);
    expect(phrases[0]).toContain('ir al médico');
    expect(phrases[1]).toContain('faltan 3 noches');
    expect(phrases.some((p) => p.includes('tranquilo'))).toBe(true);
    expect(phrases[phrases.length - 1]).toContain('volvemos a casa');
  });

  it("incluye la descripcion si existe", () => {
    const phrases = buildSocialStoryPhrases(event({ description: 'Va a estar el doctor Juan' }), now);
    expect(phrases).toContain('Va a estar el doctor Juan');
  });

  it("usa afterNote como cierre si existe, en vez del generico", () => {
    const phrases = buildSocialStoryPhrases(event({ afterNote: 'Comemos algo rico' }), now);
    expect(phrases[phrases.length - 1]).toBe('Al final: Comemos algo rico');
  });
});
