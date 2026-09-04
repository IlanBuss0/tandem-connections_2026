import { describe, expect, it } from "vitest";
import { findOverlappingSession } from "@/lib/sessionOverlap";
import type { ProfessionalSession } from "@/data/api";

function session(overrides: Partial<ProfessionalSession> = {}): ProfessionalSession {
  return {
    id: 1,
    id_profesional: 1,
    id_perteneciente: 1,
    fecha_sesion: "2026-01-01T10:00:00.000Z",
    titulo: "Sesion",
    duracion_minutos: 60,
    estado: "programada",
    recordatorios: [],
    ...overrides,
  };
}

describe("findOverlappingSession", () => {
  it("detecta una sesion que se superpone en el tiempo", () => {
    const sessions = [session({ id: 1, fecha_sesion: "2026-01-01T10:00:00.000Z", duracion_minutos: 60 })];
    const overlap = findOverlappingSession(sessions, {
      fecha_sesion: "2026-01-01T10:30:00.000Z",
      duracion_minutos: 30,
    });
    expect(overlap?.id).toBe(1);
  });

  it("no marca superposicion cuando las sesiones son consecutivas sin cruzarse", () => {
    const sessions = [session({ id: 1, fecha_sesion: "2026-01-01T10:00:00.000Z", duracion_minutos: 60 })];
    const overlap = findOverlappingSession(sessions, {
      fecha_sesion: "2026-01-01T11:00:00.000Z",
      duracion_minutos: 60,
    });
    expect(overlap).toBeUndefined();
  });

  it("ignora sesiones canceladas", () => {
    const sessions = [session({ id: 1, fecha_sesion: "2026-01-01T10:00:00.000Z", duracion_minutos: 60, estado: "cancelada" })];
    const overlap = findOverlappingSession(sessions, {
      fecha_sesion: "2026-01-01T10:30:00.000Z",
      duracion_minutos: 30,
    });
    expect(overlap).toBeUndefined();
  });

  it("ignora la propia sesion cuando se esta editando", () => {
    const sessions = [session({ id: 5, fecha_sesion: "2026-01-01T10:00:00.000Z", duracion_minutos: 60 })];
    const overlap = findOverlappingSession(sessions, {
      id: 5,
      fecha_sesion: "2026-01-01T10:00:00.000Z",
      duracion_minutos: 60,
    });
    expect(overlap).toBeUndefined();
  });
});
