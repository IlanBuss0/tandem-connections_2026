import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Pencil, Repeat, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import SessionCard from "@/components/SessionCard";
import { recurrenceLabels, type RecurrenceFrequency } from "@/lib/sessionRecurrence";
import { resizeSessionSeries, type ProfessionalSession } from "@/data/api";

export default function SessionSeriesFolder({
  groupId,
  sessions,
  patientName,
  onOpenNote,
  onEditSession,
  onDeleteSession,
  onSeriesChanged,
}: {
  groupId: string;
  /** Todas las sesiones de esta serie, ya ordenadas por fecha ascendente. */
  sessions: ProfessionalSession[];
  patientName?: string;
  onOpenNote: (session: ProfessionalSession) => void;
  onEditSession: (session: ProfessionalSession) => void;
  onDeleteSession: (session: ProfessionalSession) => void;
  onSeriesChanged: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [count, setCount] = useState("");
  const [saving, setSaving] = useState(false);

  const first = sessions[0];
  const last = sessions[sessions.length - 1];
  const frequency = (first.recurrence_rule?.frequency || "none") as RecurrenceFrequency;
  const frequencyLabel = recurrenceLabels[frequency] || recurrenceLabels.none;

  const openEditDialog = () => {
    setTitulo(first.titulo);
    setCount(String(sessions.length));
    setEditOpen(true);
  };

  const submitEdit = async () => {
    const trimmedTitulo = titulo.trim();
    const nextCount = Number(count);
    if (!trimmedTitulo || !Number.isInteger(nextCount) || nextCount < 1 || nextCount > 52) return;

    const payload: { titulo?: string; count?: number } = {};
    if (trimmedTitulo !== first.titulo) payload.titulo = trimmedTitulo;
    if (nextCount !== sessions.length) payload.count = nextCount;
    if (!Object.keys(payload).length) {
      setEditOpen(false);
      return;
    }

    setSaving(true);
    try {
      const result = await resizeSessionSeries(groupId, payload);
      setEditOpen(false);
      toast({
        title: "Serie actualizada",
        description:
          result.deletedNotesCount > 0
            ? `Se eliminaron ${result.deletedSessionIds.length} sesiones futuras, ${result.deletedNotesCount} con nota ya escrita.`
            : undefined,
      });
      onSeriesChanged();
    } catch (error) {
      toast({
        title: "No se pudo actualizar la serie",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-card">
      <div className="flex items-center gap-3 p-4">
        <button
          type="button"
          className="flex flex-1 items-center gap-3 text-left"
          onClick={() => setOpen((value) => !value)}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Repeat size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{first.titulo}</p>
            <p className="text-sm text-muted-foreground">
              {patientName} · {frequencyLabel} · {sessions.length} sesiones
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(first.fecha_sesion).toLocaleDateString("es-AR")} –{" "}
              {new Date(last.fecha_sesion).toLocaleDateString("es-AR")}
            </p>
          </div>
        </button>
        <Button size="sm" variant="ghost" onClick={openEditDialog}>
          <Pencil size={14} />
        </Button>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="p-1 text-muted-foreground"
          aria-label={open ? "Colapsar serie" : "Expandir serie"}
        >
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {open && (
        <div className="space-y-2 border-t p-3">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              patientName={patientName}
              badges={
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                  #{Number(session.recurrence_index || 0) + 1}
                </span>
              }
              onOpenNote={() => onOpenNote(session)}
              onEdit={() => onEditSession(session)}
              onDelete={() => onDeleteSession(session)}
            />
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={(next) => !saving && setEditOpen(next)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar serie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título de la serie</Label>
              <Input value={titulo} onChange={(event) => setTitulo(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cantidad total de sesiones</Label>
              <Input
                type="number"
                min={1}
                max={52}
                value={count}
                onChange={(event) => setCount(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Si agrandás, se agregan sesiones nuevas al final siguiendo el
                mismo patrón. Si achicás, se borran las últimas — nunca las
                que ya pasaron.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={submitEdit} disabled={saving}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
