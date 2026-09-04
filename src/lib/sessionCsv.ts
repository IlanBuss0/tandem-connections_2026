import type { ProfessionalSession } from "@/data/api";

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildSessionHistoryCsv(sessions: ProfessionalSession[]): string {
  const header = ["fecha", "titulo", "estado", "duracion_minutos", "motivo_cancelacion", "tiene_nota"];
  const rows = sessions.map((session) => [
    session.fecha_sesion.slice(0, 10),
    session.titulo,
    session.estado,
    String(session.duracion_minutos),
    session.motivo_cancelacion || "",
    session.has_note ? "si" : "no",
  ]);
  return [header, ...rows].map((row) => row.map(escapeCsvField).join(",")).join("\n");
}
