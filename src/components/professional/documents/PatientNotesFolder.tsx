import { useMemo } from 'react';
import { ArrowLeft, FileText, Link2 } from 'lucide-react';
import type { ProfessionalSession } from '@/data/api';
import { AVATAR_TONES } from '@/components/agenda/AgendaDayRow';
import type { AgendaPatient } from '@/components/agenda/SessionFormSheet';
import { SectionLabel } from '@/components/professional/reports/ReportsOverview';
import { CARD_SURFACE } from '@/components/professional/reports/reportCard';
import NotesToWrite from './NotesToWrite';
import { usePatientNoteDocs } from './usePatientNoteDocs';
import { initials } from '@/lib/agendaFormat';
import { groupByMonth, notesCount, notesToWrite, sessionDateTime, sessionsWithNote } from '@/lib/professionalNotesModel';
import { cn } from '@/lib/utils';

type Props = { patient: AgendaPatient; sessions: ProfessionalSession[]; onBack: () => void; onWrite: (session: ProfessionalSession) => void };

const secondary = 'inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Carpeta de un paciente: lo que falta escribir y sus notas por mes. Los nombres de Doc se piden recién acá. */
export default function PatientNotesFolder({ patient, sessions, onBack, onWrite }: Props) {
  const withNote = useMemo(() => sessionsWithNote(sessions), [sessions]);
  const months = useMemo(() => groupByMonth(withNote), [withNote]);
  const pending = useMemo(() => notesToWrite(sessions), [sessions]);
  const { docs, loading } = usePatientNoteDocs(withNote);
  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#ddcfed] bg-white px-4 text-sm font-semibold text-[#6b4c9a] shadow-sm transition hover:bg-[#f5f0ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <ArrowLeft size={18} aria-hidden /> Volver a Documentos y notas
      </button>
      <header className="flex items-center gap-4">
        <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold', AVATAR_TONES[patient.pertenecienteId % AVATAR_TONES.length])} aria-hidden>{initials(patient.name)}</span>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Carpeta</p>
          <h2 className="font-heading text-2xl font-bold leading-tight text-[#2b2145]">{patient.name}</h2>
          <p className="text-xs text-muted-foreground">{withNote.length ? notesCount(withNote.length) : 'Todavía no hay notas'}</p>
        </div>
      </header>
      <NotesToWrite sessions={pending} nameOf={() => patient.name} onWrite={onWrite} />
      {loading && <div aria-busy="true" aria-label="Cargando notas" className="space-y-3">{[0, 1].map(i => <div key={i} className="h-36 animate-pulse rounded-2xl bg-[#F1EAFB]" />)}</div>}
      {!loading && months.map(month => (
        <section key={month.label} className="space-y-2" aria-label={month.label}>
          <SectionLabel>{month.label}</SectionLabel>
          <ul className={cn(CARD_SURFACE, 'divide-y divide-[#ece3f8] px-4')}>
            {month.sessions.map(session => {
              const doc = docs[session.id];
              return (
                <li key={session.id} className="space-y-2 py-4">
                  <div>
                    <p className="text-base font-extrabold text-[#2b2145]">{session.titulo}</p>
                    <p className="text-sm text-muted-foreground">{sessionDateTime(session.fecha_sesion)}</p>
                  </div>
                  {doc && <p className="inline-flex max-w-full items-center gap-2 rounded-xl bg-[#F1EAFB] px-3 py-1.5 text-[13px] font-semibold text-[#553588]"><FileText size={15} aria-hidden className="shrink-0" /><span className="truncate">{doc.name}</span></p>}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button type="button" onClick={() => onWrite(session)} className={cn(secondary, 'justify-center bg-[#F1EAFB] text-[#553588] hover:bg-[#e8dcf8]')}><FileText size={17} aria-hidden /> Abrir nota</button>
                    {doc?.url && <a href={doc.url} target="_blank" rel="noopener noreferrer" className={cn(secondary, 'justify-center border border-[#ddcfed] bg-white text-[#553588] hover:bg-[#f5f0ff]')}><Link2 size={17} aria-hidden /> Abrir en Google Docs</a>}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
