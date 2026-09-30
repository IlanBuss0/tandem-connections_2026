import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Loader2, Plus } from "lucide-react";
import type { AgendaPatient } from "@/components/agenda/SessionFormSheet";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { fetchProfessionalReports, fetchScheduledReportTasks, type GeneratedReport, type ScheduledReportTask } from "@/data/api";
import { groupByPatient, unsentReports } from "@/lib/professionalReports";
import BuildPdfSheet from "@/components/professional/reports/BuildPdfSheet";
import PatientFolderView from "@/components/professional/reports/PatientFolderView";
import ReportsOverview from "@/components/professional/reports/ReportsOverview";
import ScheduledReportsSheet from "@/components/professional/reports/ScheduledReportsSheet";
import UnsentReportsView from "@/components/professional/reports/UnsentReportsView";
import { useReportSheets } from "@/components/professional/reports/useReportSheets";

type Tool = "pdf" | "auto" | null;

/** Reportes del Profesional: para enviar, carpetas por paciente, PDF y reportes automáticos. */
export default function ProfessionalReports({ patients, initialPatientId }: { patients: AgendaPatient[]; initialPatientId?: number }) {
  const { toast } = useToast();
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [tasks, setTasks] = useState<ScheduledReportTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<number | "unsent" | undefined>(initialPatientId);
  const [tool, setTool] = useState<Tool>(null);

  const loadReports = useCallback(async () => {
    try {
      setReports(await fetchProfessionalReports());
      setFailed(false);
    } catch {
      setFailed(true);
      toast({ title: "No pudimos cargar los reportes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  const loadTasks = useCallback(async () => setTasks(await fetchScheduledReportTasks().catch(() => [])), []);
  useEffect(() => { loadReports(); loadTasks(); }, [loadReports, loadTasks]);

  const nameById = useMemo(() => new Map(patients.map((patient) => [patient.pertenecienteId, patient.name])), [patients]);
  const nameOf = useCallback((report: GeneratedReport) => report.paciente_nombre || nameById.get(report.id_perteneciente) || "Paciente", [nameById]);
  const folders = useMemo(() => groupByPatient(reports, nameOf), [reports, nameOf]);
  const toSend = useMemo(() => unsentReports(reports), [reports]);
  const folder = typeof view === "number" ? folders.find((entry) => entry.pertenecienteId === view) : undefined;
  const { openNew, openRead, openMenu, sheets } = useReportSheets({ patients, nameOf, onChanged: loadReports });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      {view === "unsent" ? (
        <UnsentReportsView reports={toSend} nameOf={nameOf} onBack={() => setView(undefined)} onRead={openRead} onMenu={openMenu} />
      ) : folder ? (
        <PatientFolderView pertenecienteId={folder.pertenecienteId} name={folder.name} reports={folder.reports} onBack={() => setView(undefined)} onNew={() => openNew(folder.pertenecienteId)} onRead={openRead} onMenu={openMenu} />
      ) : (
        <>
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md" aria-hidden><FileText size={22} /></span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Reportes</p>
                <h2 className="font-heading text-2xl font-bold leading-tight text-[#2b2145]">Para las familias</h2>
              </div>
            </div>
            <button type="button" disabled={!patients.length} onClick={() => openNew()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
              <Plus size={16} aria-hidden /> Nuevo reporte
            </button>
          </header>
          {loading ? (
            <p className="flex items-center justify-center gap-2 py-12 text-muted-foreground"><Loader2 size={18} className="animate-spin" aria-hidden /> Cargando reportes…</p>
          ) : failed ? (
            <div role="alert" className="rounded-3xl border border-destructive/20 bg-white p-6 text-sm text-destructive shadow-sm">No pudimos cargar la información. Intentá nuevamente.<Button type="button" variant="outline" className="ml-3" onClick={() => { setLoading(true); loadReports(); }}>Reintentar</Button></div>
          ) : (
            <ReportsOverview toSend={toSend} folders={folders} tasks={tasks} nameOf={nameOf} onRead={openRead} onMenu={openMenu} onOpenUnsent={() => setView("unsent")} onOpenFolder={setView} onBuildPdf={() => setTool("pdf")} onScheduled={() => setTool("auto")} />
          )}
        </>
      )}

      {sheets}
      {tool === "pdf" && <BuildPdfSheet patients={patients} onClose={() => setTool(null)} />}
      {tool === "auto" && <ScheduledReportsSheet patients={patients} tasks={tasks} onChanged={loadTasks} onClose={() => setTool(null)} />}
    </div>
  );
}
