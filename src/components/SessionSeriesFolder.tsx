import { useMemo, useState } from "react";
import { CheckCheck, ChevronDown, ChevronUp, Loader2, Pencil, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import SessionCard from "@/components/SessionCard";
import SeriesEditSheet from "@/components/agenda/SeriesEditSheet";
import { countPastScheduled, useSeriesCompletion } from "@/hooks/useSeriesCompletion";
import { recurrenceLabels, type RecurrenceFrequency } from "@/lib/sessionRecurrence";
import type { ProfessionalSession } from "@/data/api";

export default function SessionSeriesFolder({
  groupId,
  sessions,
  patientName,
  onOpenNote,
  onEditSession,
  onDeleteSession,
  onSeriesChanged,
  compact = false,
}: {
  groupId: string;
  /** Todas las sesiones de esta serie, ya ordenadas por fecha ascendente. */
  sessions: ProfessionalSession[];
  patientName?: string;
  onOpenNote: (session: ProfessionalSession) => void;
  onEditSession: (session: ProfessionalSession) => void;
  onDeleteSession: (session: ProfessionalSession) => void;
  onSeriesChanged: () => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { completing, markPastAsCompleted } = useSeriesCompletion(onSeriesChanged);

  const first = sessions[0];
  const last = sessions[sessions.length - 1];
  const frequency = (first.recurrence_rule?.frequency || "none") as RecurrenceFrequency;
  const frequencyLabel = recurrenceLabels[frequency] || recurrenceLabels.none;
  const firstSessionDate = new Date(first.fecha_sesion);
  const compactSchedule = `${firstSessionDate.toLocaleDateString("es-AR", { weekday: "long" })} · ${firstSessionDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`;

  const pendingCompletionCount = useMemo(() => countPastScheduled(sessions), [sessions]);

  return (
    <div className="rounded-xl border border-primary/20 bg-card">
      <div className={`flex items-center gap-3 ${compact ? "p-3" : "p-4"}`}>
        <button
          type="button"
          className="flex flex-1 items-center gap-3 text-left"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={`series-${groupId}`}
        >
          <div className={`flex shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ${compact ? "h-10 w-10" : "h-12 w-12"}`}>
            <Repeat size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{first.titulo}</p>
            {compact ? (
              <p className="text-sm capitalize text-muted-foreground">
                {compactSchedule} · {sessions.length} sesiones
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {patientName} · {frequencyLabel} · {sessions.length} sesiones
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(first.fecha_sesion).toLocaleDateString("es-AR")} –{" "}
                  {new Date(last.fecha_sesion).toLocaleDateString("es-AR")}
                </p>
              </>
            )}
          </div>
        </button>
        {!compact && (
          <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)}>
            <Pencil size={14} />
          </Button>
        )}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="p-1 text-muted-foreground"
          aria-label={open ? "Colapsar serie" : "Expandir serie"}
          aria-expanded={open}
          aria-controls={`series-${groupId}`}
        >
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {open && (
        <div id={`series-${groupId}`} className="space-y-2 border-t p-3">
          {pendingCompletionCount > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-dashed bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {pendingCompletionCount} sesion{pendingCompletionCount === 1 ? "" : "es"} ya pasó
                {pendingCompletionCount === 1 ? "" : "aron"} y siguen como "programada".
              </p>
              <Button size="sm" variant="outline" onClick={() => markPastAsCompleted(groupId)} disabled={completing}>
                {completing ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
                Marcar como completadas
              </Button>
            </div>
          )}
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

      {editOpen && (
        <SeriesEditSheet groupId={groupId} sessions={sessions} onClose={() => setEditOpen(false)} onSeriesChanged={onSeriesChanged} />
      )}
    </div>
  );
}
