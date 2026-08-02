import { describe, expect, it } from "vitest";
import { formatConcreteDays } from "@/lib/concreteTime";

describe("formatConcreteDays", () => {
  const now = new Date(2026, 0, 1, 10, 0); // 1 de enero 2026

  it("hoy", () => {
    expect(formatConcreteDays('2026-01-01', now)).toBe('hoy');
  });

  it("mañana", () => {
    expect(formatConcreteDays('2026-01-02', now)).toBe('mañana');
  });

  it("en dias chicos, cuenta noches concretas", () => {
    expect(formatConcreteDays('2026-01-04', now)).toBe('faltan 3 noches');
  });

  it("a una semana exacta", () => {
    expect(formatConcreteDays('2026-01-08', now)).toBe('falta 1 semana');
  });

  it("mas de una semana, en semanas", () => {
    expect(formatConcreteDays('2026-01-15', now)).toBe('faltan 2 semanas');
  });

  it("mas de un mes, en meses", () => {
    expect(formatConcreteDays('2026-03-01', now)).toContain('meses');
  });

  it("una fecha pasada lo dice", () => {
    expect(formatConcreteDays('2025-12-30', now)).toBe('ya pasó');
  });
});
