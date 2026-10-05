import { FileText, ChevronRight } from 'lucide-react';
import type { GeneratedReport } from '@/data/api';
import { reportDate } from '@/lib/reportGrouping';

export function ReportItem({ report }: { report: GeneratedReport }) {
  const date = reportDate(report);
  const dateLabel = Number.isNaN(date.getTime()) ? 'Sin fecha' : date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  return <details className="group/report border-b border-border/70 last:border-0"><summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-primary"><FileText size={19} aria-hidden /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{report.titulo || 'Reporte de seguimiento'}</span><span className="block capitalize text-xs text-muted-foreground">{dateLabel} · {report.id_tipo === 'programado' ? 'Programado' : 'Manual'}</span></span><ChevronRight size={17} className="text-muted-foreground transition-transform group-open/report:rotate-90" aria-hidden /></summary><div className="mb-3 ml-0 rounded-2xl bg-muted/35 p-4 text-sm whitespace-pre-wrap sm:ml-[52px]">{report.contenido}</div></details>;
}

