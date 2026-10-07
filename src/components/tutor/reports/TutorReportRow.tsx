import { Download, FileText } from "lucide-react";
import type { GeneratedReport } from "@/data/api";
import { Chip } from "@/components/professional/home/HomeUi";
import { CARD_LIFT, CARD_SURFACE } from "@/components/professional/reports/reportCard";
import { shortDate } from "@/lib/professionalReports";
import { cn } from "@/lib/utils";

/** Tarjeta de un reporte recibido: sin estado de envío (todo lo que ve ya le llegó). */
export default function TutorReportRow({ report, onRead, onDownload }: { report: GeneratedReport; onRead: () => void; onDownload: () => void }) {
  const title = report.titulo || "Reporte de seguimiento";
  return (
    <li className={cn("relative overflow-hidden", CARD_SURFACE, CARD_LIFT)}>
      <span className="absolute inset-y-0 left-0 w-1.5 bg-primary/60" aria-hidden />
      <div className="flex flex-col gap-3 py-3 pl-5 pr-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-bold text-[#2b2145]">{title}</span>
            <Chip tone="purple">Llegó el {shortDate(report.fecha_envio || report.fecha_generacion)}</Chip>
          </div>
          <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-[#8b7aa0]">De {report.profesional_nombre || "tu profesional"}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button type="button" onClick={onRead} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-primary/10 px-4 text-sm font-semibold text-primary transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <FileText size={16} aria-hidden /> Leer
          </button>
          <button type="button" onClick={onDownload} aria-label={`Descargar ${title} en PDF`} className="flex h-11 w-11 items-center justify-center rounded-full text-[#675E78] transition hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Download size={20} aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}
