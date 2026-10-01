import { useMemo, useState } from "react";
import { ArrowLeft, Download, Plus } from "lucide-react";
import type { GeneratedReport } from "@/data/api";
import { AVATAR_TONES } from "@/components/agenda/AgendaDayRow";
import { SheetChip } from "@/components/agenda/AgendaSheet";
import ReportRow from "@/components/professional/reports/ReportRow";
import { SectionLabel } from "@/components/professional/reports/ReportsOverview";
import { initials } from "@/lib/agendaFormat";
import { filterReports, groupByMonth, type ReportFilter } from "@/lib/professionalReports";
import { cn } from "@/lib/utils";

const FILTERS: { value: ReportFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "unsent", label: "Sin enviar" },
  { value: "sent", label: "Enviados" },
];

/** Carpeta de un paciente: todos sus reportes, por mes, con filtro. */
export default function PatientFolderView({ pertenecienteId, name, reports, onBack, onNew, onDownload, onRead, onMenu }: { pertenecienteId: number; name: string; reports: GeneratedReport[]; onBack: () => void; onNew: () => void; onDownload: () => void; onRead: (report: GeneratedReport) => void; onMenu: (report: GeneratedReport) => void }) {
  const [filter, setFilter] = useState<ReportFilter>("all");
  const months = useMemo(() => groupByMonth(filterReports(reports, filter)), [reports, filter]);
  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#ddcfed] bg-white px-4 text-sm font-semibold text-[#6b4c9a] shadow-sm transition hover:bg-[#f5f0ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <ArrowLeft size={18} aria-hidden /> Volver a Reportes
      </button>
      <header className="flex items-center gap-4">
        <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold", AVATAR_TONES[pertenecienteId % AVATAR_TONES.length])} aria-hidden>{initials(name)}</span>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Carpeta</p>
          <h2 className="font-heading text-2xl font-bold leading-tight text-[#2b2145]">{name}</h2>
          <p className="text-xs text-muted-foreground">{reports.length} {reports.length === 1 ? "reporte" : "reportes"}</p>
        </div>
      </header>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={onNew} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto">
          <Plus size={18} aria-hidden /> Nuevo reporte para {name.split(" ")[0]}
        </button>
        <button type="button" onClick={onDownload} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary/10 px-5 text-sm font-bold text-primary transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto">
          <Download size={18} aria-hidden /> Descargar los de {name.split(" ")[0]}
        </button>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar reportes">
        {FILTERS.map((option) => <SheetChip key={option.value} selected={filter === option.value} onClick={() => setFilter(option.value)}>{option.label}</SheetChip>)}
      </div>
      {months.length === 0 && <p className="rounded-2xl bg-white p-5 text-base text-muted-foreground">No hay reportes con este filtro.</p>}
      {months.map((month) => (
        <section key={month.label} className="space-y-2" aria-label={month.label}>
          <SectionLabel>{month.label}</SectionLabel>
          <ul className="space-y-3">
            {month.reports.map((report) => <ReportRow key={report.id} report={report} primary={!report.enviado_al_tutor} onRead={() => onRead(report)} onMenu={() => onMenu(report)} />)}
          </ul>
        </section>
      ))}
    </div>
  );
}
