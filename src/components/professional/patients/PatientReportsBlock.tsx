import { ChevronRight, FileText, Plus } from "lucide-react";
import type { GeneratedReport } from "@/data/api";
import type { AgendaPatient } from "@/components/agenda/SessionFormSheet";
import ReportRow from "@/components/professional/reports/ReportRow";
import { useReportSheets } from "@/components/professional/reports/useReportSheets";
import { latestReports, shortDate } from "@/lib/professionalReports";

export const REPORTS_SECTION_ID = "patient-reports";
const VISIBLE_REPORTS = 3;

/** «Reportes de {paciente}» en la pestaña Sesiones del Centro: últimos 3 y las mismas acciones que la pantalla Reportes. */
export default function PatientReportsBlock({ patient, reports, onReportsChanged, onOpenReports }: {
  patient: AgendaPatient;
  reports: GeneratedReport[];
  /** Refresca la lista de reportes del Centro después de generar, editar, enviar o eliminar. */
  onReportsChanged: () => Promise<unknown> | void;
  /** Lleva a la carpeta del paciente en Reportes. Sin esto no se muestra «Ver los N reportes». */
  onOpenReports?: () => void;
}) {
  const { openNew, openRead, openMenu, sheets } = useReportSheets({ patients: [patient], nameOf: () => patient.name, onChanged: onReportsChanged, lockPatient: true });
  const latest = latestReports(reports, VISIBLE_REPORTS);
  const firstName = patient.name.split(" ")[0];

  return (
    <section id={REPORTS_SECTION_ID} aria-label={`Reportes de ${patient.name}`} className="min-w-0 rounded-3xl border border-white/80 bg-white/90 p-4 shadow-[0_14px_34px_rgba(65,76,110,.08)] backdrop-blur sm:p-5">
      <header className="mb-4 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#F1EAFB] to-[#e2d4f7] text-primary shadow-inner" aria-hidden><FileText size={20} /></span>
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-bold leading-tight text-[#2b2145]">Reportes de {patient.name}</h2>
          <p className="text-xs text-muted-foreground">
            {reports.length === 0 ? "Todavía no hay reportes" : `${reports.length} ${reports.length === 1 ? "reporte" : "reportes"} · último el ${shortDate(latest[0].fecha_generacion)}`}
          </p>
        </div>
      </header>

      {reports.length === 0 ? (
        <p className="mb-4 rounded-2xl bg-muted/45 p-4 text-sm text-muted-foreground">Elegí las sesiones con nota y armamos el reporte para que lo leas antes de mandarlo a la familia.</p>
      ) : (
        <ul className="mb-4 space-y-3">
          {latest.map((report, index) => <ReportRow key={report.id} report={report} primary={index === 0 && !report.enviado_al_tutor} onRead={() => openRead(report)} onMenu={() => openMenu(report)} />)}
        </ul>
      )}

      <div className="space-y-2">
        <button type="button" onClick={() => openNew(patient.pertenecienteId)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Plus size={16} aria-hidden /> Nuevo reporte para {firstName}
        </button>
        {onOpenReports && reports.length > VISIBLE_REPORTS && (
          <button type="button" onClick={onOpenReports} className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-primary/10 px-5 text-sm font-semibold text-primary transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <ChevronRight size={16} aria-hidden /> Ver los {reports.length} reportes
          </button>
        )}
      </div>
      {sheets}
    </section>
  );
}
