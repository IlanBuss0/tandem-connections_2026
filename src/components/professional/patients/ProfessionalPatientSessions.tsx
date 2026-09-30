import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, Download, Loader2, Send, Sparkles } from 'lucide-react';
import {
  askAboutPatient, deleteProfessionalSession, downloadPatientHistoryPdf, fetchPrivateProfessionalNote, prepareSessionSummary,
  type ProfessionalSession, type SessionPrepSummary,
} from '@/data/api';
import { withGoogleToken } from '@/lib/googleAuth';
import { getDocPlainText } from '@/lib/googleDocs';
import { nextSessionForPatient } from '@/lib/professionalPatientsModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import ProfessionalPrivateNote from '@/components/ProfessionalPrivateNote';
import SessionCard from '@/components/SessionCard';
import SessionSeriesFolder from '@/components/SessionSeriesFolder';

export type PatientSessionsIntent = { prepare?: ProfessionalSession; note?: ProfessionalSession };

type Props = {
  patientName: string;
  pertenecienteId: number;
  /** Sesiones de este paciente. */
  sessions: ProfessionalSession[];
  canSchedule: boolean;
  onSchedule: () => void;
  onSessionsChanged: () => void;
  /** Atajos de la Home: preparar una sesión o abrir su nota al entrar. */
  intent?: PatientSessionsIntent | null;
  onIntentHandled?: () => void;
};

/** Contenido de la pestaña Sesiones del Profesional (movido tal cual desde la ficha anterior). */
export default function ProfessionalPatientSessions({ patientName, pertenecienteId, sessions, canSchedule, onSchedule, onSessionsChanged, intent, onIntentHandled }: Props) {
  const { toast } = useToast();
  const [noteSession, setNoteSession] = useState<ProfessionalSession | null>(intent?.note ?? null);
  const [prepSession, setPrepSession] = useState<ProfessionalSession | null>(null);
  const [prepLoading, setPrepLoading] = useState(false);
  const [prepResult, setPrepResult] = useState<SessionPrepSummary | null>(null);
  const [prepError, setPrepError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [askQuestion, setAskQuestion] = useState('');
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  const patientSessions = useMemo(() => [...sessions].sort((a, b) => b.fecha_sesion.localeCompare(a.fecha_sesion)), [sessions]);
  const series = useMemo(() => Array.from(
    patientSessions.reduce((groups, session) => {
      if (!session.recurrence_group_id) return groups;
      const group = groups.get(session.recurrence_group_id) || [];
      group.push(session);
      groups.set(session.recurrence_group_id, group);
      return groups;
    }, new Map<string, ProfessionalSession[]>()),
    ([groupId, groupedSessions]) => ({ groupId, sessions: groupedSessions.sort((a, b) => a.fecha_sesion.localeCompare(b.fecha_sesion)) }),
  ).sort((a, b) => b.sessions[0].fecha_sesion.localeCompare(a.sessions[0].fecha_sesion)), [patientSessions]);
  const standaloneSessions = patientSessions.filter(session => !session.recurrence_group_id);
  const completadas = patientSessions.filter(s => s.estado === 'completada').length;
  const ausentes = patientSessions.filter(s => s.estado === 'ausente').length;
  const asistencia = completadas + ausentes > 0 ? Math.round((completadas / (completadas + ausentes)) * 100) : null;
  const nextSession = nextSessionForPatient(sessions, pertenecienteId);

  const gatherNotesFor = (candidatas: ProfessionalSession[]) => Promise.all(
    candidatas.map(async (s) => {
      let notasTexto: string | undefined;
      try {
        const note = await fetchPrivateProfessionalNote(s.id);
        const fileId = note?.documento_drive?.google_file_id;
        if (fileId) notasTexto = await withGoogleToken((token) => getDocPlainText(token, fileId));
      } catch {
        // si falla la lectura de un doc puntual, seguimos sin su texto
      }
      return { id: s.id, fecha_sesion: s.fecha_sesion, titulo: s.titulo, estado: s.estado, notas_texto: notasTexto };
    }),
  );

  const runPrepareSession = async (session: ProfessionalSession) => {
    setPrepSession(session);
    setPrepLoading(true);
    setPrepError(null);
    setPrepResult(null);
    try {
      const pastWithNotes = patientSessions
        .filter(s => s.estado !== 'programada' && s.has_note)
        .sort((a, b) => b.fecha_sesion.localeCompare(a.fecha_sesion))
        .slice(0, 3);
      if (pastWithNotes.length === 0) {
        setPrepError('No hay sesiones pasadas con notas para este paciente todavía.');
        return;
      }
      const sesionesPayload = await gatherNotesFor(pastWithNotes);
      setPrepResult(await prepareSessionSummary({
        id_perteneciente: pertenecienteId,
        sesion_objetivo: { titulo: session.titulo, fecha_sesion: session.fecha_sesion },
        sesiones_pasadas: sesionesPayload,
      }));
    } catch (err) {
      setPrepError(err instanceof Error ? err.message : 'No se pudo generar la preparación.');
    } finally {
      setPrepLoading(false);
    }
  };

  const handled = useRef(false);
  useEffect(() => {
    if (handled.current || !intent) return;
    handled.current = true;
    if (intent.prepare) void runPrepareSession(intent.prepare);
    onIntentHandled?.();
    // Solo al montar: el atajo se consume una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAskQuestion = async () => {
    if (!askQuestion.trim()) return;
    setAskLoading(true);
    setAskError(null);
    setAskAnswer(null);
    try {
      const withNotes = patientSessions.filter(s => s.has_note).slice(0, 6);
      if (withNotes.length === 0) {
        setAskError('Este paciente todavía no tiene sesiones con notas para consultar.');
        return;
      }
      const { respuesta } = await askAboutPatient({
        id_perteneciente: pertenecienteId,
        pregunta: askQuestion.trim(),
        sesiones: await gatherNotesFor(withNotes),
      });
      setAskAnswer(respuesta);
    } catch (err) {
      setAskError(err instanceof Error ? err.message : 'No se pudo responder la pregunta.');
    } finally {
      setAskLoading(false);
    }
  };

  const downloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const blob = await downloadPatientHistoryPdf(pertenecienteId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `historial-${patientName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({ title: 'No se pudo generar el PDF', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const deleteSession = async (session: ProfessionalSession) => {
    if (!window.confirm('¿Eliminar esta sesion?')) return;
    try {
      await deleteProfessionalSession(session.id);
      onSessionsChanged();
    } catch (err) {
      toast({ title: 'No se pudo eliminar la sesion', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    }
  };

  return <>
    {noteSession ? (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setNoteSession(null)}>← Volver a sesiones</Button>
        <ProfessionalPrivateNote session={noteSession} patientName={patientName} />
      </div>
    ) : (
      <div className="space-y-3">
        <div className="grid gap-3 rounded-2xl border border-[#ebe7f2] bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto] max-sm:rounded-[22px]">
          {canSchedule && <Button onClick={onSchedule} className="min-h-11">+ Programar sesión</Button>}
          <Button variant="outline" onClick={downloadPdf} disabled={downloadingPdf || patientSessions.length === 0} className="min-h-11">
            {downloadingPdf ? <Loader2 size={13} className="mr-1 animate-spin" /> : <Download size={13} className="mr-1" />}
            Historial (PDF)
          </Button>
          <div className="rounded-xl bg-violet-50 px-5 py-2 text-center text-violet-700"><p className="text-lg font-bold">{asistencia === null ? '—' : `${asistencia}%`}</p><p className="text-[10px]">de asistencia</p></div>
        </div>
        {nextSession && <section className="grid gap-4 rounded-2xl border border-[#ebe7f2] bg-white p-5 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center max-sm:rounded-[22px] max-sm:p-4"><div className="flex gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600"><CalendarClock /></span><div><p className="text-xs font-bold text-violet-600">Próxima sesión</p><h3 className="text-xl font-bold text-[#302444] max-sm:text-lg">{new Date(nextSession.fecha_sesion).toLocaleString('es-AR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</h3><p className="text-sm text-muted-foreground">{nextSession.titulo} · {nextSession.duracion_minutos} minutos</p></div></div><Button onClick={() => runPrepareSession(nextSession)} className="min-h-11 max-sm:w-full"><Sparkles size={15} className="mr-2" />Preparar con IA</Button></section>}
        {patientSessions.length === 0 && (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Todavia no hay sesiones agendadas con este paciente.
          </div>
        )}
        <section className="rounded-2xl border border-[#ebe7f2] bg-white p-4 shadow-sm"><h3 className="mb-1 font-bold text-[#302444]">Historial de sesiones</h3><p className="mb-4 text-xs text-muted-foreground">Las sesiones recurrentes se agrupan por serie. Abrí una carpeta para consultar sus sesiones y notas.</p><div className="space-y-2">{series.map(({ groupId, sessions: groupedSessions }) => (
          <SessionSeriesFolder
            key={groupId}
            groupId={groupId}
            sessions={groupedSessions}
            patientName={patientName}
            onOpenNote={setNoteSession}
            onEditSession={onSchedule}
            onDeleteSession={deleteSession}
            onSeriesChanged={onSessionsChanged}
            compact
          />
        ))}{standaloneSessions.map(session => (
          <SessionCard
            key={session.id}
            session={session}
            patientName={patientName}
            onOpenNote={() => setNoteSession(session)}
            onEdit={onSchedule}
            onDelete={() => deleteSession(session)}
            onPrepare={session.estado === 'programada' ? () => runPrepareSession(session) : undefined}
          />
        ))}</div></section>
        {patientSessions.some(s => s.has_note) && <section className="rounded-2xl border border-[#ebe7f2] bg-white p-4 shadow-sm"><p className="mb-3 flex items-center gap-2 text-sm font-semibold"><Sparkles size={16} className="text-primary" />Preguntale a la IA sobre este perteneciente</p><div className="flex flex-col gap-2 sm:flex-row"><Input value={askQuestion} onChange={e => setAskQuestion(e.target.value)} placeholder="¿Cómo evolucionó el uso de apoyos visuales?" onKeyDown={e => e.key === 'Enter' && runAskQuestion()} /><Button onClick={runAskQuestion} disabled={askLoading || !askQuestion.trim()}>{askLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} className="mr-2" />}Consultar</Button></div>{askError && <p className="mt-2 text-xs text-destructive">{askError}</p>}{askAnswer && <p className="mt-3 whitespace-pre-wrap border-t pt-3 text-sm">{askAnswer}</p>}<p className="mt-2 text-[11px] text-muted-foreground">La respuesta utiliza únicamente las sesiones y notas a las que tenés acceso.</p></section>}
      </div>
    )}

    <Dialog open={Boolean(prepSession)} onOpenChange={(open) => !open && setPrepSession(null)}>
      <DialogContent className="sm:max-w-lg max-lg:bottom-0 max-lg:left-0 max-lg:top-auto max-lg:max-h-[88dvh] max-lg:w-full max-lg:max-w-none max-lg:translate-x-0 max-lg:translate-y-0 max-lg:overflow-y-auto max-lg:rounded-b-none max-lg:rounded-t-[28px] max-lg:p-5">
        <DialogHeader>
          <DialogTitle>Preparación — {prepSession?.titulo}</DialogTitle>
        </DialogHeader>
        {prepLoading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" /> Generando preparación con IA…
          </div>
        )}
        {prepError && !prepLoading && <p className="text-sm text-destructive">{prepError}</p>}
        {prepResult && !prepLoading && <Textarea readOnly value={prepResult.contenido} className="min-h-[280px] text-sm" />}
        <Button variant="outline" onClick={() => setPrepSession(null)}>Cerrar</Button>
      </DialogContent>
    </Dialog>
  </>;
}
