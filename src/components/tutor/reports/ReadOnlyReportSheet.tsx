import { Download, X } from "lucide-react";
import { AgendaSheet } from "@/components/agenda/AgendaSheet";
import type { GeneratedReport } from "@/data/api";

const footerButton = "flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Lee un reporte recibido (solo lectura): se puede descargar, no editar ni enviar. */
export default function ReadOnlyReportSheet({ report, subtitle, onClose, onDownload }: { report: GeneratedReport; subtitle: string; onClose: () => void; onDownload: () => void }) {
  return (
    <AgendaSheet
      large
      title={report.titulo || "Reporte de seguimiento"}
      subtitle={subtitle}
      onClose={onClose}
      footer={
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onDownload} className={`${footerButton} bg-primary text-primary-foreground shadow-sm`}><Download size={18} aria-hidden /> Descargar PDF</button>
          <button type="button" onClick={onClose} className={`${footerButton} border border-primary/20 bg-white text-primary hover:bg-primary/5`}><X size={18} aria-hidden /> Cerrar</button>
        </div>
      }
    >
      <div className="whitespace-pre-wrap rounded-2xl bg-[#F5EFFC] p-4 text-sm leading-relaxed text-[#2b2145]">{report.contenido}</div>
    </AgendaSheet>
  );
}
