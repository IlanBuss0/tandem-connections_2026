import { ArrowLeft } from "lucide-react";
import type { GeneratedReport } from "@/data/api";
import ReportRow from "@/components/professional/reports/ReportRow";

/** Todos los reportes sin enviar, de todos los pacientes. */
export default function UnsentReportsView({ reports, nameOf, onBack, onRead, onMenu }: { reports: GeneratedReport[]; nameOf: (report: GeneratedReport) => string; onBack: () => void; onRead: (report: GeneratedReport) => void; onMenu: (report: GeneratedReport) => void }) {
  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#ddcfed] bg-white px-4 text-sm font-semibold text-[#6b4c9a] shadow-sm transition hover:bg-[#f5f0ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <ArrowLeft size={18} aria-hidden /> Volver a Reportes
      </button>
      <header>
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Para enviar</p>
        <h2 className="font-heading text-2xl font-bold leading-tight text-[#2b2145]">Sin enviar</h2>
        <p className="text-xs text-muted-foreground">{reports.length} {reports.length === 1 ? "reporte" : "reportes"} esperando tu lectura</p>
      </header>
      {reports.length === 0 && <p className="rounded-2xl bg-white p-5 text-sm text-muted-foreground">No tenés reportes sin enviar.</p>}
      <ul className="space-y-3">
        {reports.map((report) => <ReportRow key={report.id} report={report} patientName={nameOf(report)} primary onRead={() => onRead(report)} onMenu={() => onMenu(report)} />)}
      </ul>
    </div>
  );
}
