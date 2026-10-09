import { ChevronRight, Folder } from 'lucide-react';
import type { AgendaPatient } from '@/components/agenda/SessionFormSheet';
import { Chip } from '@/components/professional/home/HomeUi';
import { SectionLabel } from '@/components/professional/reports/ReportsOverview';
import { CARD_LIFT, CARD_SURFACE } from '@/components/professional/reports/reportCard';
import { folderLine, type FolderSummary } from '@/lib/professionalNotesModel';
import { cn } from '@/lib/utils';

export type NotesFolder = { patient: AgendaPatient; summary: FolderSummary };

/** Una carpeta por paciente vinculado, con cuántas notas tiene y cuál fue la última. */
export default function PatientNotesFolders({ folders, onOpen }: { folders: NotesFolder[]; onOpen: (pertenecienteId: number) => void }) {
  return (
    <section className="space-y-2" aria-label="Carpetas por paciente">
      <SectionLabel>Carpetas por paciente</SectionLabel>
      <p className="px-1 text-sm text-muted-foreground">Acá están todas las notas que escribiste, ordenadas por paciente.</p>
      {folders.length === 0 && <p className={cn(CARD_SURFACE, 'p-5 text-sm text-muted-foreground')}>Todavía no tenés pacientes vinculados.</p>}
      <ul className="grid gap-3 sm:grid-cols-2">
        {folders.map(({ patient, summary }) => (
          <li key={patient.pertenecienteId}>
            <button type="button" onClick={() => onOpen(patient.pertenecienteId)} className={cn(CARD_SURFACE, CARD_LIFT, 'flex min-h-16 w-full items-center gap-3 p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#F1EAFB] to-[#e2d4f7] text-primary" aria-hidden><Folder size={20} /></span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#2b2145]">{patient.name}{summary.toWrite > 0 && <Chip tone="amber">{summary.toWrite} sin nota</Chip>}</span>
                <span className="block text-xs text-muted-foreground">{folderLine(summary)}</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-primary" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
