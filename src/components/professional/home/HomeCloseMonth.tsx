import { Check, FileText, PenLine } from 'lucide-react';
import type { GeneratedReport, ProfessionalSession, User } from '@/data/api';
import { HomeButton, HomeCard, Chip } from './HomeUi';
import { Divider, RowText, RowTitle } from './homeTokens';
import { formatClock, plural } from './homeData';
import { cn } from '@/lib/utils';

type Props = {
  missingNotes: ProfessionalSession[];
  reports: GeneratedReport[];
  now: Date;
  patientOf: (session: ProfessionalSession) => User | undefined;
  onWriteNote: (session: ProfessionalSession) => void;
  onReviewReports: () => void;
};

const Icon = ({ className, children }: { className: string; children: React.ReactNode }) => <span aria-hidden className={cn('inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[14px]', className)}>{children}</span>;

function sessionWhen(session: ProfessionalSession, now: Date) {
  const date = new Date(session.fecha_sesion);
  const sameDay = date.toDateString() === now.toDateString();
  return `${sameDay ? 'hoy' : date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }).replace('.', '')} ${formatClock(session.fecha_sesion)}`;
}

export default function HomeCloseMonth({ missingNotes, reports, now, patientOf, onWriteNote, onReviewReports }: Props) {
  const first = missingNotes[0];
  const firstPatient = first && patientOf(first);
  const month = now.toLocaleDateString('es-AR', { month: 'long' });
  return <HomeCard className="px-[18px] py-1.5">
    {first
      ? <div className="flex min-h-[44px] items-center gap-3 py-3">
        <Icon className="bg-[#FFEFCF] text-[#7A4300]"><PenLine size={20} strokeWidth={2} /></Icon>
        <div className="min-w-0 flex-1"><div className={RowTitle}>{plural(missingNotes.length, 'sesión sin nota', 'sesiones sin nota')}</div><div className={RowText}>{firstPatient ? `${firstPatient.name.split(' ')[0]} · ` : ''}{sessionWhen(first, now)}</div></div>
        <HomeButton onClick={() => onWriteNote(first)}>Completar</HomeButton>
      </div>
      : <div className="flex min-h-[44px] items-center gap-3 py-3">
        <Icon className="bg-[#DCF5EA] text-[#0B6B4A]"><Check size={20} strokeWidth={2.4} /></Icon>
        <div className={RowTitle}>Notas al día</div>
      </div>}
    {reports.length > 0 && <div className={cn('flex min-h-[44px] items-center gap-3 py-3', Divider)}>
      <Icon className="bg-[#F1EAFB] text-[#553588]"><FileText size={20} strokeWidth={2} /></Icon>
      <div className="min-w-0 flex-1"><div className={RowTitle}>Reportes de {month}</div><div className="mt-1.5"><Chip tone="purple">{reports.length === 1 ? '1 borrador listo para revisar' : `${reports.length} borradores listos para revisar`}</Chip></div></div>
      <HomeButton primary onClick={onReviewReports}>Revisar</HomeButton>
    </div>}
  </HomeCard>;
}
