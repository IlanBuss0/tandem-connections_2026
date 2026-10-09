import { FileText, MoreHorizontal, Send } from "lucide-react";
import type { GeneratedReport } from "@/data/api";
import { AVATAR_TONES } from "@/components/agenda/AgendaDayRow";
import { Chip } from "@/components/professional/home/HomeUi";
import { CARD_LIFT, CARD_SURFACE } from "@/components/professional/reports/reportCard";
import { initials } from "@/lib/agendaFormat";
import { reportTitle, shortDate } from "@/lib/professionalReports";
import { cn } from "@/lib/utils";

/** Tarjeta de un reporte: en «Para enviar» lleva al paciente; dentro de su carpeta no. */
export default function ReportRow({ report, patientName, primary, onRead, onMenu }: { report: GeneratedReport; patientName?: string; primary?: boolean; onRead: () => void; onMenu: () => void }) {
  const sent = report.enviado_al_tutor;
  const generated = `Generado el ${shortDate(report.fecha_generacion)} · ${report.id_tipo === "programado" ? "automático" : "manual"}`;
  return (
    <li className={cn("relative overflow-hidden", CARD_SURFACE, CARD_LIFT)}>
      <span className={cn("absolute inset-y-0 left-0 w-1.5", sent ? "bg-emerald-400" : "bg-amber-400")} aria-hidden />
      <div className="flex flex-col gap-3 py-3 pl-5 pr-3 sm:flex-row sm:items-center sm:gap-4">
        {patientName && (
          <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-2 ring-white shadow-sm", AVATAR_TONES[report.id_perteneciente % AVATAR_TONES.length])} aria-hidden>{initials(patientName)}</span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={patientName ? "text-base font-bold text-[#2b2145]" : "text-sm font-bold text-[#2b2145]"}>{patientName ?? reportTitle(report)}</span>
            {sent ? <Chip tone="green">Enviado el {shortDate(report.fecha_envio)}</Chip> : <Chip tone="amber">Sin enviar</Chip>}
          </div>
          {patientName && <p className="mt-0.5 text-sm font-medium text-[#2b2145]">{reportTitle(report)}</p>}
          <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-[#8b7aa0]">{generated}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={onRead}
            className={cn(
              "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              primary ? "bg-primary text-primary-foreground shadow-sm" : "bg-primary/10 text-primary hover:bg-primary/15",
            )}
          >
            {sent ? <FileText size={16} aria-hidden /> : <Send size={16} aria-hidden />}
            {sent ? "Leer" : "Leer y enviar"}
          </button>
          <button
            type="button"
            onClick={onMenu}
            aria-label={`Más acciones del reporte de ${patientName ?? reportTitle(report)}`}
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#675E78] transition hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MoreHorizontal size={20} aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}
