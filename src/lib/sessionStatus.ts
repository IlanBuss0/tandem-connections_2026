import type { ProfessionalSession } from "@/data/api";

export function sessionStatusBadgeClass(estado: ProfessionalSession["estado"]) {
  if (estado === "completada") return "bg-success/10 text-success";
  if (estado === "cancelada") return "bg-destructive/10 text-destructive";
  if (estado === "ausente") return "bg-amber-500/10 text-amber-600";
  return "bg-primary/10 text-primary"; // programada
}
