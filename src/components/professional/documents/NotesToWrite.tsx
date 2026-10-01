import { useState } from 'react';
import { ChevronRight, PenLine } from 'lucide-react';
import type { ProfessionalSession } from '@/data/api';
import { AVATAR_TONES } from '@/components/agenda/AgendaDayRow';
import { Chip } from '@/components/professional/home/HomeUi';
import { SectionLabel } from '@/components/professional/reports/ReportsOverview';
import { CARD_SURFACE } from '@/components/professional/reports/reportCard';
import { initials } from '@/lib/agendaFormat';
import { sessionWhen } from '@/lib/professionalNotesModel';
import { cn } from '@/lib/utils';

const MAX_VISIBLE = 5;

type Props = { sessions: ProfessionalSession[]; nameOf: (session: ProfessionalSession) => string; onWrite: (session: ProfessionalSession) => void };

/** Sesiones completadas sin nota. Sin ninguna, no se muestra. */
export default function NotesToWrite({ sessions, nameOf, onWrite }: Props) {
  const [expanded, setExpanded] = useState(false);
  if (!sessions.length) return null;
  const visible = expanded ? sessions : sessions.slice(0, MAX_VISIBLE);
  return (
    <section className="space-y-2" aria-label="Para escribir">
      <SectionLabel>Para escribir · {sessions.length}</SectionLabel>
      <ul className={cn(CARD_SURFACE, 'divide-y divide-[#ece3f8] px-4')}>
        {visible.map(session => {
          const name = nameOf(session);
          return (
            <li key={session.id} className="flex gap-3 py-4">
              <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-extrabold', AVATAR_TONES[session.id_perteneciente % AVATAR_TONES.length])} aria-hidden>{initials(name)}</span>
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="flex flex-wrap items-center gap-2 text-base font-extrabold text-[#2b2145]">{name}<Chip tone="amber">Sin nota</Chip></p>
                <p className="text-sm text-muted-foreground">{session.titulo} · {sessionWhen(session.fecha_sesion)}</p>
                <button type="button" onClick={() => onWrite(session)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-extrabold text-primary-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <PenLine size={17} aria-hidden /> Escribir nota
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {sessions.length > MAX_VISIBLE && (
        <button type="button" onClick={() => setExpanded(value => !value)} aria-expanded={expanded} className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {expanded ? 'Ver menos' : `Ver más (${sessions.length - MAX_VISIBLE})`} <ChevronRight size={16} aria-hidden className={expanded ? '-rotate-90' : 'rotate-90'} />
        </button>
      )}
    </section>
  );
}
