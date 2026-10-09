import { Download, X } from "lucide-react";
import ReportReader from "@/components/shared/ReportReader";
import type { GeneratedReport } from "@/data/api";

const footerButton = "flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Lee un reporte recibido (solo lectura): se puede descargar, no editar ni enviar. */
export default function ReadOnlyReportSheet({ report, subtitle, onClose, onDownload }: { report: GeneratedReport; subtitle: string; onClose: () => void; onDownload: () => void }) {
  return (
    <ReportReader
      title={report.titulo || "Reporte de seguimiento"}
      subtitle={subtitle}
      content={report.contenido}
      onClose={onClose}
      footer={
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onDownload} className={`${footerButton} bg-primary text-primary-foreground shadow-sm`}><Download size={18} aria-hidden /> Descargar PDF</button>
          <button type="button" onClick={onClose} className={`${footerButton} border border-primary/20 bg-white text-primary hover:bg-primary/5`}><X size={18} aria-hidden /> Cerrar</button>
        </div>
      }
    />
  );
}
