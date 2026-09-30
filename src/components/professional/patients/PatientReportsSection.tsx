import { useMemo } from 'react';
import { FileText } from 'lucide-react';
import type { GeneratedReport } from '@/data/api';
import { ReportItem } from '@/components/TutorReportsPanel';
import { monthKey, reportTime } from '@/lib/reportGrouping';

export const REPORTS_SECTION_ID = 'patient-reports';

/** Reportes enviados por profesionales, agrupados por mes (mismo diseño que la pestaña Sesiones anterior). */
export default function PatientReportsSection({ reports }: { reports: GeneratedReport[] }) {
  const months = useMemo(() => Object.entries([...reports].sort((a, b) => reportTime(b) - reportTime(a)).reduce((result, report) => {
    const key = monthKey(report);
    (result[key] ||= []).push(report);
    return result;
  }, {} as Record<string, GeneratedReport[]>)), [reports]);

  return <section id={REPORTS_SECTION_ID} className="min-w-0 rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-[0_14px_34px_rgba(65,76,110,.08)] backdrop-blur sm:p-5">
    <header className="mb-4 flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><FileText size={19} aria-hidden /></span><div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-primary/75">Enviados por profesionales</p><h2 className="font-heading text-lg font-bold text-foreground">Reportes</h2></div></header>
    {months.length ? <div className="space-y-3">{months.map(([month, monthReports], index) => <details key={month} open={index === 0} className="group overflow-hidden rounded-2xl border border-border/70 bg-white"><summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold capitalize">{month}</span><span className="block text-xs text-muted-foreground">{monthReports.length} {monthReports.length === 1 ? 'reporte' : 'reportes'}</span></span></summary><div className="border-t border-border/60 px-3">{monthReports.map(report => <ReportItem key={report.id} report={report} />)}</div></details>)}</div>
      : <p className="rounded-2xl bg-muted/45 p-4 text-sm text-muted-foreground">Todavía no hay reportes para mostrar acá.</p>}
  </section>;
}
