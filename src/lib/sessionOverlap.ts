import type { ProfessionalSession } from "@/data/api";

export function findOverlappingSession(
  sessions: ProfessionalSession[],
  candidate: { id?: number; fecha_sesion: string; duracion_minutos: number },
): ProfessionalSession | undefined {
  const start = new Date(candidate.fecha_sesion).getTime();
  if (Number.isNaN(start) || !candidate.duracion_minutos) return undefined;
  const end = start + candidate.duracion_minutos * 60 * 1000;

  return sessions.find((session) => {
    if (candidate.id !== undefined && session.id === candidate.id) return false;
    if (session.estado === "cancelada") return false;
    const sessionStart = new Date(session.fecha_sesion).getTime();
    const sessionEnd = sessionStart + session.duracion_minutos * 60 * 1000;
    return start < sessionEnd && sessionStart < end;
  });
}
