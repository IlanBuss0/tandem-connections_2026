import { describe, expect, it } from "vitest";
import type { GeneratedReport, ProfessionalSession } from "@/data/api";
import { filterReports, groupByMonth, groupByPatient, monthRange, pdfPreview, rangeError, unsentReports } from "@/lib/professionalReports";

const report = (id: number, patient: number, generated: string, sent: boolean): GeneratedReport => ({
  id, id_profesional: 1, id_perteneciente: patient, titulo: "", contenido: "x", id_tipo: "manual",
  fecha_generacion: generated, enviado_al_tutor: sent, fecha_envio: sent ? generated : null, paciente_nombre: `P${patient}`,
});
const reports = [
  report(1, 1, "2026-08-10T12:00:00", true),
  report(2, 1, "2026-09-28T12:00:00", false),
  report(3, 2, "2026-09-27T12:00:00", false),
  report(4, 2, "2026-09-01T12:00:00", true),
];
const session = (id: number, patient: number, date: string) => ({ id, id_perteneciente: patient, fecha_sesion: date }) as unknown as ProfessionalSession;

describe("professionalReports", () => {
  it("agrupa por paciente con conteo de sin enviar y último reporte", () => {
    const folders = groupByPatient(reports, (r) => r.paciente_nombre || "");
    expect(folders.map((f) => [f.name, f.reports.length, f.unsent, f.last.id])).toEqual([["P1", 2, 1, 2], ["P2", 2, 1, 3]]);
  });

  it("cuenta y ordena los reportes sin enviar y filtra", () => {
    expect(unsentReports(reports).map((r) => r.id)).toEqual([2, 3]);
    expect(filterReports(reports, "sent").map((r) => r.id)).toEqual([1, 4]);
    expect(filterReports(reports, "all")).toHaveLength(4);
  });

  it("agrupa por mes de generación, primero el más reciente", () => {
    expect(groupByMonth(reports).map((g) => [g.label, g.reports.length])).toEqual([["Septiembre 2026", 3], ["Agosto 2026", 1]]);
  });

  it("calcula la vista previa del PDF con las sesiones cargadas", () => {
    const sessions = [session(1, 1, "2026-09-07T12:00:00"), session(2, 1, "2026-09-14T12:00:00"), session(3, 2, "2026-09-14T12:00:00"), session(4, 2, "2026-08-14T12:00:00"), session(5, 9, "2026-09-14T12:00:00")];
    const ids = [1, 2];
    expect(pdfPreview(sessions, { pertenecienteIds: ids, ...monthRange(2026, 9) })).toEqual({ patients: 2, sessions: 3 });
    expect(pdfPreview(sessions, { pertenecienteIds: [2] })).toEqual({ patients: 1, sessions: 2 });
    expect(pdfPreview(sessions, { pertenecienteIds: ids, desde: "2026-09-01", hasta: "2026-09-10" })).toEqual({ patients: 1, sessions: 1 });
    expect(pdfPreview(sessions, { pertenecienteIds: [1], ...monthRange(2026, 9) })).toEqual({ patients: 1, sessions: 2 });
  });

  it("valida el período elegido como el backend", () => {
    expect(rangeError("2026-09-01", "2026-09-30")).toBeNull();
    expect(rangeError("", "2026-09-30")).not.toBeNull();
    expect(rangeError("2026-09-30", "2026-09-01")).not.toBeNull();
    expect(rangeError("2025-01-01", "2026-01-02")).not.toBeNull();
    expect(rangeError("2025-01-01", "2026-01-01")).toBeNull();
    expect(monthRange(2026, 2)).toEqual({ desde: "2026-02-01", hasta: "2026-02-28" });
  });
});
