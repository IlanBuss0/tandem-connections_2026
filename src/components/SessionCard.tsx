import type { ReactNode } from "react";
import { CheckCircle2, Clock, FileText, Pencil, Sparkles, Trash2 } from "lucide-react";
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
  onPrepare,
}: {
  session: ProfessionalSession;
  patientName?: string;
  /** Badges extra (ej. "#3 de la serie") — el de estado siempre se muestra. */
  badges?: ReactNode;
  onOpenNote: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPrepare?: () => void;
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
          {session.estado === "cancelada" && session.motivo_cancelacion && (
            <p className="mt-1 text-xs text-muted-foreground">
              Motivo: {session.motivo_cancelacion}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={onOpenNote}>
            {session.has_note ? (
              <CheckCircle2 size={14} className="mr-2 text-success" />
            ) : (
              <FileText size={14} className="mr-2" />
            )}
            {session.has_note ? "Ver nota" : "Nota privada"}
          </Button>
          {session.estado === "programada" && onPrepare && (
            <Button size="sm" variant="outline" onClick={onPrepare}>
              <Sparkles size={14} className="mr-2" /> Preparar sesión
            </Button>
          )}
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
