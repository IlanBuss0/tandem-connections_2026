import { describe, expect, it } from "vitest";
import { buildSessionHistoryCsv } from "@/lib/sessionCsv";
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

describe("buildSessionHistoryCsv", () => {
  it("genera el header y una fila por sesion, sin contenido clinico", () => {
    const csv = buildSessionHistoryCsv([
      session({ titulo: "Primera sesion", estado: "completada", has_note: true }),
    ]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("fecha,titulo,estado,duracion_minutos,motivo_cancelacion,tiene_nota");
    expect(lines[1]).toBe("2026-01-01,Primera sesion,completada,60,,si");
  });

  it("escapa comas y comillas en el titulo o motivo", () => {
    const csv = buildSessionHistoryCsv([
      session({ titulo: 'Sesion, "urgente"', estado: "cancelada", motivo_cancelacion: "Se fue, no volvio" }),
    ]);
    const lines = csv.split("\n");
    expect(lines[1]).toBe('2026-01-01,"Sesion, ""urgente""",cancelada,60,"Se fue, no volvio",no');
  });
});
