import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Loader2, Pencil, Plus, RefreshCw, Trash2, FileSearch } from "lucide-react";
import type { AgendaPatient } from "@/components/agenda/SessionFormSheet";
import AgendaItemMenu from "@/components/agenda/AgendaItemMenu";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { deleteReport, fetchProfessionalReports, fetchScheduledReportTasks, type GeneratedReport, type ScheduledReportTask } from "@/data/api";
import { groupByPatient, reportTitle, unsentReports } from "@/lib/professionalReports";
import BuildPdfSheet from "@/components/professional/reports/BuildPdfSheet";
import DeleteReportDialog from "@/components/professional/reports/DeleteReportDialog";
import EditReportSheet from "@/components/professional/reports/EditReportSheet";
import NewReportSheet from "@/components/professional/reports/NewReportSheet";
import PatientFolderView from "@/components/professional/reports/PatientFolderView";
import ReadReportSheet from "@/components/professional/reports/ReadReportSheet";
import ReportsOverview from "@/components/professional/reports/ReportsOverview";
import ScheduledReportsSheet from "@/components/professional/reports/ScheduledReportsSheet";
import UnsentReportsView from "@/components/professional/reports/UnsentReportsView";

type Sheet =
  | { kind: "new"; patientId?: number; replacing?: GeneratedReport }
  | { kind: "read"; report: GeneratedReport }
  | { kind: "edit"; report: GeneratedReport }
  | { kind: "menu"; report: GeneratedReport }
  | { kind: "delete"; report: GeneratedReport }
  | { kind: "pdf" }
  | { kind: "auto" }
  | null;

const SENT_HINT = "Ya se envió al tutor.";

/** Reportes del Profesional: para enviar, carpetas por paciente, PDF y reportes automáticos. */
export default function ProfessionalReports({ patients, initialPatientId }: { patients: AgendaPatient[]; initialPatientId?: number }) {
  const { toast } = useToast();
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [tasks, setTasks] = useState<ScheduledReportTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<number | "unsent" | undefined>(initialPatientId);
  const [sheet, setSheet] = useState<Sheet>(null);

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

  const read = (report: GeneratedReport) => setSheet({ kind: "read", report });
  const openMenu = (report: GeneratedReport) => setSheet({ kind: "menu", report });

  const menuActions = (report: GeneratedReport) => [
    { label: "Leer", icon: <FileSearch size={22} />, onClick: () => read(report) },
    { label: "Editar", icon: <Pencil size={22} />, disabled: report.enviado_al_tutor, hint: report.enviado_al_tutor ? SENT_HINT : undefined, onClick: () => setSheet({ kind: "edit", report }) },
    { label: "Volver a generar", icon: <RefreshCw size={22} />, disabled: report.enviado_al_tutor, hint: report.enviado_al_tutor ? SENT_HINT : undefined, onClick: () => setSheet({ kind: "new", replacing: report }) },
    { label: "Eliminar", icon: <Trash2 size={22} />, danger: true, onClick: () => setSheet({ kind: "delete", report }) },
  ];

  const onGenerated = async (report: GeneratedReport, replaced?: GeneratedReport) => {
    setSheet({ kind: "read", report });
    if (replaced) {
      try {
        await deleteReport(replaced.id);
        toast({ title: "Listo, el reporte nuevo reemplazó al anterior" });
      } catch {
        toast({ title: "El reporte nuevo quedó listo, pero no pudimos borrar el anterior", variant: "destructive" });
      }
    } else {
      toast({ title: "Listo, el reporte quedó en «Para enviar»" });
    }
    await loadReports();
  };

  const confirmDelete = async (report: GeneratedReport) => {
    setSheet(null);
    try {
      await deleteReport(report.id);
      toast({ title: "Eliminamos el reporte" });
      await loadReports();
    } catch (error) {
      toast({ title: "No pudimos eliminar el reporte", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      {view === "unsent" ? (
        <UnsentReportsView reports={toSend} nameOf={nameOf} onBack={() => setView(undefined)} onRead={read} onMenu={openMenu} />
      ) : folder ? (
        <PatientFolderView pertenecienteId={folder.pertenecienteId} name={folder.name} reports={folder.reports} onBack={() => setView(undefined)} onNew={() => setSheet({ kind: "new", patientId: folder.pertenecienteId })} onRead={read} onMenu={openMenu} />
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
            <button type="button" disabled={!patients.length} onClick={() => setSheet({ kind: "new" })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
              <Plus size={16} aria-hidden /> Nuevo reporte
            </button>
          </header>
          {loading ? (
            <p className="flex items-center justify-center gap-2 py-12 text-muted-foreground"><Loader2 size={18} className="animate-spin" aria-hidden /> Cargando reportes…</p>
          ) : failed ? (
            <div role="alert" className="rounded-3xl border border-destructive/20 bg-white p-6 text-sm text-destructive shadow-sm">No pudimos cargar la información. Intentá nuevamente.<Button type="button" variant="outline" className="ml-3" onClick={() => { setLoading(true); loadReports(); }}>Reintentar</Button></div>
          ) : (
            <ReportsOverview toSend={toSend} folders={folders} tasks={tasks} nameOf={nameOf} onRead={read} onMenu={openMenu} onOpenUnsent={() => setView("unsent")} onOpenFolder={setView} onBuildPdf={() => setSheet({ kind: "pdf" })} onScheduled={() => setSheet({ kind: "auto" })} />
          )}
        </>
      )}

      {sheet?.kind === "new" && <NewReportSheet patients={patients} initialPatientId={sheet.patientId} replacing={sheet.replacing} onClose={() => setSheet(null)} onGenerated={(report) => onGenerated(report, sheet.replacing)} />}
      {sheet?.kind === "read" && <ReadReportSheet report={sheet.report} patientName={nameOf(sheet.report)} onClose={() => setSheet(null)} onSent={loadReports} onEdit={() => setSheet({ kind: "edit", report: sheet.report })} />}
      {sheet?.kind === "edit" && <EditReportSheet report={sheet.report} patientName={nameOf(sheet.report)} onClose={() => setSheet(null)} onSaved={(report) => { setSheet({ kind: "read", report }); loadReports(); }} />}
      {sheet?.kind === "menu" && <AgendaItemMenu title={reportTitle(sheet.report)} subtitle={`${nameOf(sheet.report)} · ${sheet.report.enviado_al_tutor ? "Enviado" : "Sin enviar"}`} actions={menuActions(sheet.report)} onClose={() => setSheet(null)} />}
      {sheet?.kind === "delete" && <DeleteReportDialog report={sheet.report} patientName={nameOf(sheet.report)} onConfirm={() => confirmDelete(sheet.report)} onClose={() => setSheet(null)} />}
      {sheet?.kind === "pdf" && <BuildPdfSheet patients={patients} onClose={() => setSheet(null)} />}
      {sheet?.kind === "auto" && <ScheduledReportsSheet patients={patients} tasks={tasks} onChanged={loadTasks} onClose={() => setSheet(null)} />}
    </div>
  );
}
