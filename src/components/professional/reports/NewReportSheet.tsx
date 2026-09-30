import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { AgendaSheet, SheetLabel } from "@/components/agenda/AgendaSheet";
import { PatientChips, type AgendaPatient } from "@/components/agenda/SessionFormSheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/professional/home/HomeUi";
import { useToast } from "@/components/ui/use-toast";
import { withGoogleToken } from "@/lib/googleAuth";
import { getDocPlainText } from "@/lib/googleDocs";
import { clockOf } from "@/lib/agendaFormat";
import { fetchPrivateProfessionalNote, fetchProfessionalSessions, generatePatientReport, type GeneratedReport, type ProfessionalSession } from "@/data/api";

/** Manda al backend cada sesión con el texto de su nota de Drive (si se puede leer). */
async function toReportSession(session: ProfessionalSession) {
  let notasTexto: string | undefined;
  try {
    const fileId = (await fetchPrivateProfessionalNote(session.id))?.documento_drive?.google_file_id;
    if (fileId) notasTexto = await withGoogleToken((token) => getDocPlainText(token, fileId));
  } catch {
    // si falla la lectura de un doc puntual, seguimos sin su texto
  }
  return { id: session.id, fecha_sesion: session.fecha_sesion, titulo: session.titulo, estado: session.estado, notas_texto: notasTexto };
}

const sessionWhen = (session: ProfessionalSession) => {
  const date = new Date(session.fecha_sesion);
  return `${date.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" }).replace(/[.,]/g, "")} · ${clockOf(date)}`;
};

export default function NewReportSheet({ patients, initialPatientId, replacing, onClose, onGenerated }: { patients: AgendaPatient[]; initialPatientId?: number; /** Reporte que se reemplaza al volver a generar. */ replacing?: GeneratedReport; onClose: () => void; onGenerated: (report: GeneratedReport) => void }) {
  const { toast } = useToast();
  const [patientId, setPatientId] = useState(String(replacing?.id_perteneciente ?? initialPatientId ?? ""));
  const [sessions, setSessions] = useState<ProfessionalSession[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setSelected(new Set());
    setSessions([]);
    if (!patientId) return;
    let active = true;
    setLoading(true);
    fetchProfessionalSessions(Number(patientId))
      .then((rows) => active && setSessions(rows.filter((session) => session.has_note).sort((a, b) => b.fecha_sesion.localeCompare(a.fecha_sesion))))
      .catch(() => toast({ title: "No pudimos cargar las sesiones", variant: "destructive" }))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [patientId, toast]);

  const toggle = (id: number) => setSelected((prev) => {
    const next = new Set(prev);
    if (!next.delete(id)) next.add(id);
    return next;
  });

  const allSelected = sessions.length > 0 && selected.size === sessions.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(sessions.map((session) => session.id)));

  const generate = async () => {
    setGenerating(true);
    try {
      const chosen = sessions.filter((session) => selected.has(session.id));
      const report = await generatePatientReport({ id_perteneciente: Number(patientId), sesiones: await Promise.all(chosen.map(toReportSession)) });
      onGenerated(report);
    } catch (error) {
      toast({ title: "No pudimos generar el reporte", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AgendaSheet
      title={replacing ? "Volver a generar" : "Nuevo reporte"}
      subtitle={replacing ? "Elegí las sesiones: el reporte nuevo reemplaza al anterior." : undefined}
      onClose={onClose}
      footer={
        <button type="button" onClick={generate} disabled={generating || selected.size === 0} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
          {generating ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Sparkles size={18} aria-hidden />}
          Generar reporte{selected.size > 0 && ` · ${selected.size} ${selected.size === 1 ? "sesión" : "sesiones"}`}
        </button>
      }
    >
      {!replacing && <PatientChips patients={patients} value={patientId} onChange={setPatientId} />}
      {patientId && (
        <div>
          <div className="flex items-start justify-between gap-3">
            <SheetLabel>Sesiones para incluir</SheetLabel>
            {!loading && sessions.length > 1 && (
              <button type="button" onClick={toggleAll} className="-mt-1 inline-flex min-h-11 items-center rounded-full px-3 text-xs font-bold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {allSelected ? "Quitar todas" : "Seleccionar todas"}
              </button>
            )}
          </div>
          <p className="mb-2 text-sm text-muted-foreground">Solo aparecen las sesiones que tienen nota.</p>
          {loading ? (
            <p className="flex items-center gap-2 py-3 text-sm text-muted-foreground"><Loader2 size={16} className="animate-spin" aria-hidden /> Cargando sesiones…</p>
          ) : sessions.length === 0 ? (
            <p className="rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">Este paciente todavía no tiene sesiones con nota.</p>
          ) : (
            <ul className="divide-y divide-border/60 border-t border-border/60">
              {sessions.map((session) => (
                <li key={session.id}>
                  <label className="flex min-h-14 cursor-pointer items-center gap-3 py-2">
                    <Checkbox checked={selected.has(session.id)} onCheckedChange={() => toggle(session.id)} className="h-6 w-6 rounded-lg" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-[#2b2145]">{session.titulo}</span>
                      <span className="block text-xs text-muted-foreground">{sessionWhen(session)}</span>
                    </span>
                    <Chip tone="green">Con nota</Chip>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </AgendaSheet>
  );
}
