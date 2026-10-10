import { useState } from "react";
import { Download, Info, Loader2, Pencil, Send, X } from "lucide-react";
import ReportReader from "@/components/shared/ReportReader";
import { useToast } from "@/components/ui/use-toast";
import { sendReportToTutor, type GeneratedReport } from "@/data/api";
import { professionalByline, reportTitle, shortDate } from "@/lib/professionalReports";
import { downloadSingleReport } from "@/lib/reportsPdf";

const footerButton = "flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

/** Lee el reporte (solo lectura) y, si falta, lo manda al tutor. El envío solo ocurre tocando «Enviar al tutor». */
export default function ReadReportSheet({ report, patientName, onClose, onSent, onEdit }: { report: GeneratedReport; patientName: string; onClose: () => void; onSent: () => void; onEdit: () => void }) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const sent = report.enviado_al_tutor;

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      await downloadSingleReport(report, patientName, professionalByline);
    } catch {
      toast({ title: "No pudimos armar el PDF", description: "Intentá nuevamente.", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };
  const pdfButton = (
    <button type="button" onClick={downloadPdf} disabled={downloading} className={`${footerButton} border border-primary/20 bg-white text-primary hover:bg-primary/5`}>
      {downloading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Download size={16} aria-hidden />} {sent ? "Descargar PDF" : "PDF"}
    </button>
  );

  const send = async () => {
    setSending(true);
    try {
      await sendReportToTutor(report.id);
      toast({ title: "Listo, le mandamos el reporte al tutor" });
      onSent();
      onClose();
    } catch (error) {
      toast({ title: "No pudimos mandar el reporte", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <ReportReader
      title={reportTitle(report)}
      subtitle={`${patientName} · generado el ${shortDate(report.fecha_generacion)}`}
      content={report.contenido}
      onClose={onClose}
      footer={
        <div className="space-y-2">
          {!sent && (
            <button type="button" onClick={send} disabled={sending} className={`${footerButton} bg-primary text-primary-foreground shadow-sm`}>
              {sending ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Send size={18} aria-hidden />}
              Enviar al tutor
            </button>
          )}
          <div className={sent ? "grid grid-cols-2 gap-2" : "grid grid-cols-3 gap-2"}>
            {!sent && (
              <button type="button" onClick={onEdit} className={`${footerButton} border border-primary/20 bg-white text-primary hover:bg-primary/5`}>
                <Pencil size={16} aria-hidden /> Editar
              </button>
            )}
            {pdfButton}
            <button type="button" onClick={onClose} className={`${footerButton} border border-primary/20 bg-white text-primary hover:bg-primary/5`}>
              <X size={18} aria-hidden /> Cerrar
            </button>
          </div>
        </div>
      }
      notice={sent ? (
        <p className="text-sm font-bold text-emerald-800">Se envió al tutor el {shortDate(report.fecha_envio)}</p>
      ) : (
        <p className="flex items-start gap-2.5 rounded-2xl bg-[#FFEFCF] p-3 text-sm font-semibold text-[#7A4300]">
          <Info size={22} className="mt-0.5 shrink-0" aria-hidden />
          Lo armó la IA con tus notas. Leelo antes de mandarlo a la familia.
        </p>
      )}
      afterContent={!sent && <p className="text-sm text-muted-foreground">Queda guardado en «Para enviar» hasta que lo mandes.</p>}
    />
  );
}
