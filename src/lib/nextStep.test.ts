import { describe, expect, it } from "vitest";
import { findNextStep, type StepLike } from "@/lib/nextStep";

function step(overrides: Partial<StepLike> = {}): StepLike {
  return { id: '1', time: '10:00', title: 'Paso', completed: false, ...overrides };
}

describe("findNextStep", () => {
  it("encuentra el proximo paso pendiente que todavia no llego", () => {
    const now = new Date(2026, 0, 1, 9, 30);
    const items = [step({ id: 'a', time: '09:00' }), step({ id: 'b', time: '10:00' }), step({ id: 'c', time: '11:00' })];
    const result = findNextStep(items, now);
    expect(result?.step.id).toBe('b');
    expect(result?.minutesUntil).toBe(30);
  });

  it("ignora los pasos ya completados", () => {
    const now = new Date(2026, 0, 1, 8, 0);
    const items = [step({ id: 'a', time: '09:00', completed: true }), step({ id: 'b', time: '10:00' })];
    const result = findNextStep(items, now);
    expect(result?.step.id).toBe('b');
  });

  it("si todos los horarios ya pasaron, devuelve el ultimo pendiente con minutos negativos", () => {
    const now = new Date(2026, 0, 1, 12, 0);
    const items = [step({ id: 'a', time: '09:00' }), step({ id: 'b', time: '10:00' })];
    const result = findNextStep(items, now);
    expect(result?.step.id).toBe('b');
    expect(result?.minutesUntil).toBeLessThan(0);
  });

  it("sin pasos pendientes devuelve null", () => {
    const now = new Date(2026, 0, 1, 9, 0);
    const items = [step({ id: 'a', completed: true })];
    expect(findNextStep(items, now)).toBeNull();
  });

  it("ignora horarios con formato invalido en vez de romper", () => {
    const now = new Date(2026, 0, 1, 9, 0);
    const items = [step({ id: 'a', time: 'no-es-hora' }), step({ id: 'b', time: '11:00' })];
    const result = findNextStep(items, now);
    expect(result?.step.id).toBe('b');
  });
});
