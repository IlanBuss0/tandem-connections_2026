import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { AgendaSheet, SheetLabel, sheetInputClass } from "@/components/agenda/AgendaSheet";
import { useToast } from "@/components/ui/use-toast";
import { updateReport, type GeneratedReport } from "@/data/api";
import { reportTitle } from "@/lib/professionalReports";

/** Edita el título y el texto ya escrito de un reporte que todavía no se envió. */
export default function EditReportSheet({ report, patientName, onClose, onSaved }: { report: GeneratedReport; patientName: string; onClose: () => void; onSaved: (report: GeneratedReport) => void }) {
  const { toast } = useToast();
  const [titulo, setTitulo] = useState(reportTitle(report));
  const [contenido, setContenido] = useState(report.contenido);
  const [saving, setSaving] = useState(false);
  const unchanged = titulo.trim() === reportTitle(report) && contenido.trim() === report.contenido.trim();
  const invalid = !titulo.trim() || !contenido.trim();

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateReport(report.id, { titulo: titulo.trim(), contenido: contenido.trim() });
      toast({ title: "Guardamos los cambios del reporte" });
      onSaved(updated);
    } catch (error) {
      toast({ title: "No pudimos guardar el reporte", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AgendaSheet
      large
      title="Editar reporte"
      subtitle={patientName}
      onClose={onClose}
      footer={
        <button type="button" onClick={save} disabled={saving || unchanged || invalid} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
          {saving ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Check size={18} aria-hidden />}
          Guardar cambios
        </button>
      }
    >
      <label className="block">
        <SheetLabel>Título</SheetLabel>
        <input value={titulo} onChange={(event) => setTitulo(event.target.value)} maxLength={200} className={`${sheetInputClass} text-sm`} />
      </label>
      <label className="block">
        <SheetLabel>Texto del reporte</SheetLabel>
        <textarea value={contenido} onChange={(event) => setContenido(event.target.value)} rows={12} maxLength={20000} className={`${sheetInputClass} min-h-[16rem] resize-y py-3 text-sm leading-relaxed`} />
      </label>
      <p className="text-xs text-muted-foreground">Podés cambiar lo que escribió la IA. Después lo leés y lo mandás cuando quieras.</p>
    </AgendaSheet>
  );
}
