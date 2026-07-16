import type { ReactNode } from "react";
import { Clock, FileText, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { sessionStatusBadgeClass } from "@/lib/sessionStatus";
import type { ProfessionalSession } from "@/data/api";

export default function SessionCard({
  session,
  patientName,
  badges,
  onOpenNote,
  onEdit,
  onDelete,
}: {
  session: ProfessionalSession;
  patientName?: string;
  /** Badges extra (ej. "#3 de la serie") — el de estado siempre se muestra. */
  badges?: ReactNode;
  onOpenNote: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const date = new Date(session.fecha_sesion);
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Clock size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{session.titulo}</p>
          <p className="text-sm text-muted-foreground">
            {patientName} ·{" "}
            {date.toLocaleString("es-AR", {
              dateStyle: "medium",
              timeStyle: "short",
            })}{" "}
            · {session.duracion_minutos} min
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge className={`capitalize ${sessionStatusBadgeClass(session.estado)}`}>
              {session.estado}
            </Badge>
            {badges}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={onOpenNote}>
            <FileText size={14} className="mr-2" />
            Nota privada
          </Button>
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Pencil size={14} />
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={onDelete}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
