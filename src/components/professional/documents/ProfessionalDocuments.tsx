import { useMemo, useState } from 'react';
import { FileText, FolderOpen, Lock } from 'lucide-react';
import type { ProfessionalSession } from '@/data/api';
import DriveExplorer from '@/components/DriveExplorer';
import ProfessionalPrivateNote from '@/components/ProfessionalPrivateNote';
import type { AgendaPatient } from '@/components/agenda/SessionFormSheet';
import { Button } from '@/components/ui/button';
import { folderSummary, notesToWrite } from '@/lib/professionalNotesModel';
import NotesToWrite from './NotesToWrite';
import PatientNotesFolder from './PatientNotesFolder';
import PatientNotesFolders from './PatientNotesFolders';

type Props = {
  sessions: ProfessionalSession[];
  patients: AgendaPatient[];
  /** Vuelve a pedir las sesiones (para que `has_note` se actualice al volver de una nota). */
  onRefresh: () => void;
};

/** Documentos y notas: notas por escribir, carpetas por paciente y, debajo, el explorador de Drive. */
export default function ProfessionalDocuments({ sessions, patients, onRefresh }: Props) {
  const [noteSession, setNoteSession] = useState<ProfessionalSession | null>(null);
  const [folderId, setFolderId] = useState<number | null>(null);
  const linked = useMemo(() => new Set(patients.map(patient => patient.pertenecienteId)), [patients]);
  const linkedSessions = useMemo(() => sessions.filter(session => linked.has(Number(session.id_perteneciente))), [sessions, linked]);
  const nameOf = (session: ProfessionalSession) => patients.find(patient => patient.pertenecienteId === Number(session.id_perteneciente))?.name || 'Paciente';
  const folders = useMemo(
    () => patients.map(patient => ({ patient, summary: folderSummary(linkedSessions.filter(session => Number(session.id_perteneciente) === patient.pertenecienteId)) })),
    [patients, linkedSessions],
  );
  const folder = patients.find(patient => patient.pertenecienteId === folderId);

  if (noteSession) {
    const name = nameOf(noteSession);
    return (
      <div className="space-y-4">
        <Button variant="ghost" className="min-h-11" onClick={() => { setNoteSession(null); onRefresh(); }}>← Volver</Button>
        <div>
          <h2 className="font-heading text-xl font-bold">Nota privada · {noteSession.titulo}</h2>
          <p className="text-sm text-muted-foreground">{name} · Solo vos podés leer esta nota.</p>
        </div>
        <ProfessionalPrivateNote session={noteSession} patientName={name} />
      </div>
    );
  }

  const privacy = (
    <p className="flex items-center gap-3 rounded-2xl border border-dashed border-[#d9c9f0] bg-[#faf6ff] p-3.5 text-sm text-muted-foreground">
      <Lock size={18} className="shrink-0 text-primary" aria-hidden />Tus notas son privadas: solo vos las ves. No se comparten con la familia.
    </p>
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      {folder ? (
        <PatientNotesFolder patient={folder} sessions={linkedSessions.filter(session => Number(session.id_perteneciente) === folder.pertenecienteId)} onBack={() => setFolderId(null)} onWrite={setNoteSession} />
      ) : (
        <>
          <header className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground" aria-hidden><FileText size={28} /></span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Documentos y notas</p>
              <h1 className="font-heading text-3xl font-bold leading-tight text-[#2b2145]">Tus notas de sesión</h1>
            </div>
          </header>
          <NotesToWrite sessions={notesToWrite(linkedSessions)} nameOf={nameOf} onWrite={setNoteSession} />
          <PatientNotesFolders folders={folders} onOpen={setFolderId} />
        </>
      )}
      {privacy}
      {!folder && (
        <section className="rounded-[24px] border border-[#ece3f8] bg-white p-4 shadow-[0_8px_24px_#f0e8f8] sm:p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#2e2344]"><FolderOpen className="text-primary" aria-hidden />Documentos</h2>
          <DriveExplorer />
        </section>
      )}
    </div>
  );
}
