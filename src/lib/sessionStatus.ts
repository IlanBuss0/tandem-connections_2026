import type { ProfessionalSession } from "@/data/api";

export function sessionStatusBadgeClass(estado: ProfessionalSession["estado"]) {
  if (estado === "completada") return "bg-success/10 text-success";
  if (estado === "cancelada") return "bg-destructive/10 text-destructive";
  if (estado === "ausente") return "bg-amber-500/10 text-amber-600";
  return "bg-primary/10 text-primary"; // programada
}

/** Color del puntito en el calendario. Completada sin nota cuenta como "sin nota". */
export function sessionStatusDotClass(session: Pick<ProfessionalSession, "estado" | "has_note">) {
  if (session.estado === "completada") return session.has_note ? "bg-emerald-500" : "bg-amber-500";
  if (session.estado === "cancelada") return "bg-rose-500";
  if (session.estado === "ausente") return "bg-amber-500";
  return "bg-primary"; // programada
}

export const eventDotClass = "bg-[#3d9bd6]";
