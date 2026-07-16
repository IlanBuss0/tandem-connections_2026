import type { ProfessionalSession } from "@/data/api";

export function sessionStatusBadgeClass(estado: ProfessionalSession["estado"]) {
  if (estado === "completada") return "bg-success/10 text-success";
  if (estado === "cancelada") return "bg-destructive/10 text-destructive";
  return "bg-primary/10 text-primary"; // programada
}
