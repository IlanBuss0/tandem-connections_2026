import { useState } from "react";
import { Check } from "lucide-react";
import { AVATAR_TONES } from "@/components/agenda/AgendaDayRow";
import { AgendaSheet, SheetChip } from "@/components/agenda/AgendaSheet";
import type { AgendaPatient } from "@/components/agenda/SessionFormSheet";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { deactivateScheduledReportTask, upsertScheduledReportTask, type ScheduledReportTask } from "@/data/api";
import { initials } from "@/lib/agendaFormat";
import { weekdayDate } from "@/lib/professionalReports";
import { cn } from "@/lib/utils";

type Frequency = ScheduledReportTask["frecuencia"] | "none";
const OPTIONS: { value: Frequency; label: string }[] = [
  { value: "none", label: "Sin programar" },
  { value: "diario", label: "Diario" },
  { value: "semanal", label: "Semanal" },
  { value: "mensual", label: "Mensual" },
];

/** Frecuencia y envío automático por paciente. «Sin programar» desactiva la tarea. */
export default function ScheduledReportsSheet({ patients, tasks, onChanged, onClose }: { patients: AgendaPatient[]; tasks: ScheduledReportTask[]; onChanged: () => Promise<void>; onClose: () => void }) {
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<number | null>(null);

  const run = async (pertenecienteId: number, action: () => Promise<unknown>) => {
    setBusyId(pertenecienteId);
    try {
      await action();
      await onChanged();
      toast({ title: "Guardamos los cambios" });
    } catch (error) {
      toast({ title: "No pudimos guardar los cambios", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const setFrequency = (patient: AgendaPatient, task: ScheduledReportTask | undefined, value: Frequency) => {
    if (value === "none") return task && run(patient.pertenecienteId, () => deactivateScheduledReportTask(task.id));
    return run(patient.pertenecienteId, () => upsertScheduledReportTask({ id_perteneciente: patient.pertenecienteId, frecuencia: value, enviar_automatico: task?.enviar_automatico ?? false, activo: true }));
  };

  return (
    <AgendaSheet
      title="Reportes automáticos"
      onClose={onClose}
      footer={
        <button type="button" onClick={onClose} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Check size={18} aria-hidden /> Listo
        </button>
      }
    >
      <p className="text-sm text-muted-foreground">Con «Enviar automático» el reporte le llega a la familia sin que lo leas antes.</p>
      <ul className="divide-y divide-border/60">
        {patients.map((patient) => {
          const task = tasks.find((entry) => entry.id_perteneciente === patient.pertenecienteId && entry.activo);
          const current: Frequency = task?.frecuencia ?? "none";
          const busy = busyId === patient.pertenecienteId;
          return (
            <li key={patient.pertenecienteId} className="space-y-3 py-4 first:pt-0">
              <div className="flex items-center gap-3">
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold", AVATAR_TONES[patient.pertenecienteId % AVATAR_TONES.length])} aria-hidden>{initials(patient.name)}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#2b2145]">{patient.name}</p>
                  <p className="text-xs text-muted-foreground">{task ? `Próximo reporte: ${weekdayDate(task.proxima_ejecucion)}` : "No se generan reportes solos"}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label={`Frecuencia para ${patient.name}`}>
                {OPTIONS.map((option) => (
                  <SheetChip key={option.value} selected={current === option.value} onClick={() => !busy && current !== option.value && setFrequency(patient, task, option.value)}>{option.label}</SheetChip>
                ))}
              </div>
              <label className={cn("flex min-h-11 items-center justify-between gap-3 text-sm font-semibold text-[#2b2145]", !task && "opacity-60")}>
                Enviar automático
                <Switch
                  checked={task?.enviar_automatico ?? false}
                  disabled={!task || busy}
                  onCheckedChange={(checked) => task && run(patient.pertenecienteId, () => upsertScheduledReportTask({ id_perteneciente: patient.pertenecienteId, frecuencia: task.frecuencia, enviar_automatico: checked, activo: true }))}
                />
              </label>
            </li>
          );
        })}
      </ul>
    </AgendaSheet>
  );
}
