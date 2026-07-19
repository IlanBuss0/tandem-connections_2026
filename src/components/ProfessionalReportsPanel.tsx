import { useEffect, useState } from "react";
import { FileText, Loader2, Send, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { withGoogleToken } from "@/lib/googleAuth";
import { getDocPlainText } from "@/lib/googleDocs";
import {
  fetchPrivateProfessionalNote,
  fetchProfessionalSessions,
  fetchScheduledReportTasks,
  generatePatientReport,
  sendReportToTutor,
  downloadMonthlyReportPdf,
  upsertScheduledReportTask,
  type GeneratedReport,
  type ProfessionalSession,
  type ScheduledReportTask,
  type User,
} from "@/data/api";

type ReportPatient = User & { pertenecienteId: number };

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function ProfessionalReportsPanel({ patients }: { patients: ReportPatient[] }) {
  const { toast } = useToast();

  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [sessions, setSessions] = useState<ProfessionalSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<number>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [sending, setSending] = useState(false);

  const [pdfMonth, setPdfMonth] = useState(String(new Date().getMonth() + 1));
  const [pdfYear, setPdfYear] = useState(String(new Date().getFullYear()));
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const [tasks, setTasks] = useState<ScheduledReportTask[]>([]);
  const [savingTaskFor, setSavingTaskFor] = useState<number | null>(null);

  useEffect(() => {
    fetchScheduledReportTasks().then(setTasks).catch(() => {});
  }, []);

  useEffect(() => {
    setReport(null);
    setSelectedSessionIds(new Set());
    if (!selectedPatientId) {
      setSessions([]);
      return;
    }
    setLoadingSessions(true);
    fetchProfessionalSessions(Number(selectedPatientId))
      .then((rows) => setSessions(rows.filter((s) => s.has_note)))
      .catch(() => toast({ title: "No se pudieron cargar las sesiones", variant: "destructive" }))
      .finally(() => setLoadingSessions(false));
  }, [selectedPatientId]);

  const toggleSession = (id: number) => {
    setSelectedSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const generateReport = async () => {
    if (!selectedPatientId || selectedSessionIds.size === 0) return;
    setGenerating(true);
    try {
      const selected = sessions.filter((s) => selectedSessionIds.has(s.id));
      const sesionesPayload = await Promise.all(
        selected.map(async (session) => {
          let notasTexto: string | undefined;
          try {
            const note = await fetchPrivateProfessionalNote(session.id);
            const fileId = note?.documento_drive?.google_file_id;
            if (fileId) {
              notasTexto = await withGoogleToken((token) => getDocPlainText(token, fileId));
            }
          } catch {
            // si falla la lectura de un doc puntual, seguimos sin su texto
          }
          return {
            id: session.id,
            fecha_sesion: session.fecha_sesion,
            titulo: session.titulo,
            estado: session.estado,
            notas_texto: notasTexto,
          };
        }),
      );

      const generated = await generatePatientReport({
        id_perteneciente: Number(selectedPatientId),
        sesiones: sesionesPayload,
      });
      setReport(generated);
    } catch (err) {
      toast({
        title: "No se pudo generar el reporte",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const sendToTutor = async () => {
    if (!report) return;
    setSending(true);
    try {
      const updated = await sendReportToTutor(report.id);
      setReport(updated);
      toast({ title: "Reporte enviado al tutor" });
    } catch (err) {
      toast({
        title: "No se pudo enviar el reporte",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const downloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const blob = await downloadMonthlyReportPdf(Number(pdfYear), Number(pdfMonth));
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte-mensual-${pdfYear}-${String(pdfMonth).padStart(2, "0")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({
        title: "No se pudo generar el PDF",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const taskFor = (pertenecienteId: number) => tasks.find((t) => t.id_perteneciente === pertenecienteId);

  const saveTask = async (pertenecienteId: number, frecuencia: ScheduledReportTask["frecuencia"], enviarAutomatico: boolean) => {
    setSavingTaskFor(pertenecienteId);
    try {
      const updated = await upsertScheduledReportTask({
        id_perteneciente: pertenecienteId,
        frecuencia,
        enviar_automatico: enviarAutomatico,
        activo: true,
      });
      setTasks((prev) => {
        const withoutCurrent = prev.filter((t) => t.id_perteneciente !== pertenecienteId);
        return [...withoutCurrent, updated];
      });
      toast({ title: "Programación guardada" });
    } catch (err) {
      toast({
        title: "No se pudo guardar la programación",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSavingTaskFor(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Generador manual */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-1.5">
          <Sparkles size={14} className="text-primary" /> Resumen con IA por paciente
        </h4>
        <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar paciente" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((patient) => (
              <SelectItem key={patient.pertenecienteId} value={String(patient.pertenecienteId)}>
                {patient.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedPatientId && (
          <div className="space-y-2">
            {loadingSessions && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin" /> Cargando sesiones...
              </p>
            )}
            {!loadingSessions && sessions.length === 0 && (
              <p className="text-xs text-muted-foreground">Este paciente no tiene sesiones con nota vinculada todavía.</p>
            )}
            {sessions.map((session) => (
              <label key={session.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={selectedSessionIds.has(session.id)}
                  onCheckedChange={() => toggleSession(session.id)}
                />
                {session.titulo} · {new Date(session.fecha_sesion).toLocaleDateString("es-AR")}
              </label>
            ))}
            {sessions.length > 0 && (
              <Button size="sm" onClick={generateReport} disabled={generating || selectedSessionIds.size === 0}>
                {generating ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Sparkles size={14} className="mr-1.5" />}
                Generar reporte
              </Button>
            )}
          </div>
        )}

        {report && (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">{report.titulo}</p>
            <Textarea value={report.contenido} readOnly rows={8} className="text-sm" />
            <Button
              size="sm"
              variant="outline"
              onClick={sendToTutor}
              disabled={sending || report.enviado_al_tutor}
            >
              {sending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Send size={14} className="mr-1.5" />}
              {report.enviado_al_tutor ? "Ya enviado al tutor" : "Mandar a tutor"}
            </Button>
          </div>
        )}
      </div>

      {/* PDF mensual */}
      <div className="space-y-2 border-t pt-4">
        <h4 className="text-sm font-semibold flex items-center gap-1.5">
          <FileText size={14} className="text-primary" /> Reporte mensual (PDF)
        </h4>
        <div className="flex flex-wrap gap-2">
          <Select value={pdfMonth} onValueChange={setPdfMonth}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES.map((mes, i) => (
                <SelectItem key={mes} value={String(i + 1)}>{mes}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            type="number"
            value={pdfYear}
            onChange={(e) => setPdfYear(e.target.value)}
            className="w-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <Button size="sm" variant="outline" onClick={downloadPdf} disabled={downloadingPdf}>
            {downloadingPdf ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Download size={14} className="mr-1.5" />}
            Descargar PDF
          </Button>
        </div>
      </div>

      {/* Programación */}
      <div className="space-y-2 border-t pt-4">
        <h4 className="text-sm font-semibold">Reportes automáticos por paciente</h4>
        <div className="space-y-2">
          {patients.map((patient) => {
            const task = taskFor(patient.pertenecienteId);
            return (
              <div key={patient.pertenecienteId} className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 p-2">
                <span className="text-sm font-medium flex-1 min-w-[100px]">{patient.name}</span>
                <Select
                  value={task?.frecuencia ?? ""}
                  onValueChange={(value) => saveTask(patient.pertenecienteId, value as ScheduledReportTask["frecuencia"], task?.enviar_automatico ?? false)}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Sin programar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diario">Diario</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Switch
                    checked={task?.enviar_automatico ?? false}
                    disabled={!task || savingTaskFor === patient.pertenecienteId}
                    onCheckedChange={(checked) => task && saveTask(patient.pertenecienteId, task.frecuencia, checked)}
                  />
                  Enviar automático
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
