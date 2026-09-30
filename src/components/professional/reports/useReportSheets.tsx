import { useState, type ReactNode } from "react";
import { FileSearch, Pencil, RefreshCw, Trash2 } from "lucide-react";
import AgendaItemMenu from "@/components/agenda/AgendaItemMenu";
import type { AgendaPatient } from "@/components/agenda/SessionFormSheet";
import { useToast } from "@/components/ui/use-toast";
import { deleteReport, type GeneratedReport } from "@/data/api";
import { reportTitle } from "@/lib/professionalReports";
import DeleteReportDialog from "@/components/professional/reports/DeleteReportDialog";
import EditReportSheet from "@/components/professional/reports/EditReportSheet";
import NewReportSheet from "@/components/professional/reports/NewReportSheet";
import ReadReportSheet from "@/components/professional/reports/ReadReportSheet";

type Sheet =
  | { kind: "new"; patientId?: number; replacing?: GeneratedReport }
  | { kind: "read"; report: GeneratedReport }
  | { kind: "edit"; report: GeneratedReport }
  | { kind: "menu"; report: GeneratedReport }
  | { kind: "delete"; report: GeneratedReport }
  | null;

const SENT_HINT = "Ya se envió al tutor.";

type Options = {
  patients: AgendaPatient[];
  nameOf: (report: GeneratedReport) => string;
  /** Se llama después de generar, editar, enviar o eliminar, para refrescar la lista de quien lo usa. */
  onChanged: () => Promise<unknown> | void;
  /** El paciente viene elegido y no se puede cambiar (Centro del paciente). */
  lockPatient?: boolean;
};

/** Hojas de un reporte (nuevo, leer, editar, menú ⋯ y eliminar), compartidas por Reportes y el Centro del paciente. */
export function useReportSheets({ patients, nameOf, onChanged, lockPatient }: Options) {
  const { toast } = useToast();
  const [sheet, setSheet] = useState<Sheet>(null);
  const close = () => setSheet(null);

  const openRead = (report: GeneratedReport) => setSheet({ kind: "read", report });
  const openMenu = (report: GeneratedReport) => setSheet({ kind: "menu", report });
  const openNew = (patientId?: number) => setSheet({ kind: "new", patientId });

  const menuActions = (report: GeneratedReport) => [
    { label: "Leer", icon: <FileSearch size={22} />, onClick: () => openRead(report) },
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
    await onChanged();
  };

  const confirmDelete = async (report: GeneratedReport) => {
    close();
    try {
      await deleteReport(report.id);
      toast({ title: "Eliminamos el reporte" });
      await onChanged();
    } catch (error) {
      toast({ title: "No pudimos eliminar el reporte", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    }
  };

  const sheets: ReactNode = (
    <>
      {sheet?.kind === "new" && <NewReportSheet patients={patients} initialPatientId={sheet.patientId} replacing={sheet.replacing} lockPatient={lockPatient} onClose={close} onGenerated={(report) => onGenerated(report, sheet.replacing)} />}
      {sheet?.kind === "read" && <ReadReportSheet report={sheet.report} patientName={nameOf(sheet.report)} onClose={close} onSent={onChanged} onEdit={() => setSheet({ kind: "edit", report: sheet.report })} />}
      {sheet?.kind === "edit" && <EditReportSheet report={sheet.report} patientName={nameOf(sheet.report)} onClose={close} onSaved={(report) => { setSheet({ kind: "read", report }); onChanged(); }} />}
      {sheet?.kind === "menu" && <AgendaItemMenu title={reportTitle(sheet.report)} subtitle={`${nameOf(sheet.report)} · ${sheet.report.enviado_al_tutor ? "Enviado" : "Sin enviar"}`} actions={menuActions(sheet.report)} onClose={close} />}
      {sheet?.kind === "delete" && <DeleteReportDialog report={sheet.report} patientName={nameOf(sheet.report)} onConfirm={() => confirmDelete(sheet.report)} onClose={close} />}
    </>
  );

  return { openNew, openRead, openMenu, sheets };
}
