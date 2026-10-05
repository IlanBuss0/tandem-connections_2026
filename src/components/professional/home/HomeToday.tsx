import { Check, ChevronRight, Clock, PenLine, Sparkle } from 'lucide-react';
import type { AcompanamientoData, ProfessionalSession, User } from '@/data/api';
import type { AutonomyCardUsage } from '@/data/usageApi';
import { Chip, HomeButton, HomeCard, PatientAvatar, Pressable } from './HomeUi';
import { Divider, RowText } from './homeTokens';
import { buildContextLine, formatClock, formatEta, minutesUntil, pauseCardUsage, unfinishedAgreements } from './homeData';
import { cn } from '@/lib/utils';

type Props = {
  sessions: ProfessionalSession[];
  next?: ProfessionalSession;
  now: Date;
  patientOf: (session: ProfessionalSession) => User | undefined;
  agreements: Record<string, AcompanamientoData>;
  usage: Record<string, AutonomyCardUsage[]>;
  onOpenPatient: (userId: string) => void;
  onPrepareSession: (session: ProfessionalSession) => void;
  onWriteNote: (session: ProfessionalSession) => void;
};

function StatusChip({ session, isNext }: { session: ProfessionalSession; isNext: boolean }) {
  if (isNext) return <Chip tone="purple"><Clock size={14} strokeWidth={2.4} aria-hidden />Sigue</Chip>;
  if (session.estado === 'completada') return session.has_note
    ? <Chip tone="green"><Check size={14} strokeWidth={2.4} aria-hidden />Nota guardada</Chip>
    : <Chip tone="amber"><PenLine size={14} strokeWidth={2.4} aria-hidden />Sin nota</Chip>;
  if (session.estado === 'ausente') return <Chip tone="gray">Ausente</Chip>;
  return null;
}

function TodayRow({ session, patient, isNext, first, line, props }: { session: ProfessionalSession; patient: User; isNext: boolean; first: boolean; line: string; props: Props }) {
  const needsNote = session.estado === 'completada' && !session.has_note;
  return <div className={cn('flex gap-3', isNext ? 'mt-2.5 rounded-[18px] border-[1.5px] border-[#DACBF0] bg-[#F7F3FC] p-3' : cn('py-3', !first && Divider))}>
    <div className="w-[46px] shrink-0 text-center"><div className="text-[13.5px] font-extrabold">{formatClock(session.fecha_sesion)}</div><span aria-hidden className={cn('mt-1.5 inline-block h-2.5 w-2.5 rounded-full', isNext ? 'bg-[#6F4CA6]' : 'bg-[#DACBF0]')} /></div>
    <PatientAvatar patient={patient} size={40} />
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <Pressable onClick={() => props.onOpenPatient(patient.id)} className="relative inline-flex min-h-8 items-center gap-0.5 text-[15px] font-extrabold text-[#2B2145] before:absolute before:-inset-y-1.5 before:inset-x-0 before:content-['']">{patient.name.split(' ')[0]}<ChevronRight size={16} strokeWidth={2.6} color="#553588" aria-hidden /></Pressable>
        <StatusChip session={session} isNext={isNext} />
      </div>
      {line && <div className={cn(RowText, 'mt-1 text-[12.5px]')}>{line}</div>}
      {isNext && <div className="mt-2.5 flex flex-wrap gap-2"><HomeButton primary onClick={() => props.onPrepareSession(session)}><Sparkle size={17} strokeWidth={2.4} aria-hidden />Preparar sesión</HomeButton></div>}
      {needsNote && <div className="mt-2.5 flex flex-wrap gap-2"><HomeButton onClick={() => props.onWriteNote(session)}><PenLine size={17} strokeWidth={2.4} aria-hidden />Escribir nota</HomeButton></div>}
    </div>
  </div>;
}

export default function HomeToday(props: Props) {
  const rows = props.sessions.flatMap(session => { const patient = props.patientOf(session); return patient ? [{ session, patient }] : []; });
  return <HomeCard className="p-3.5">
    {rows.length === 0 && <p className="px-1 py-3 text-[13px] text-[#675E78]">Hoy no tenés sesiones.</p>}
    {rows.map(({ session, patient }, index) => {
      const isNext = session.id === props.next?.id;
      const line = buildContextLine({
        finished: session.estado === 'completada' ? `Terminó · ${session.duracion_minutos} min` : undefined,
        eta: isNext ? (minutesUntil(session, props.now) > 0 ? formatEta(minutesUntil(session, props.now)) : undefined) : undefined,
        usage: pauseCardUsage(props.usage[patient.id]),
        agreements: unfinishedAgreements(props.agreements[patient.id]),
      });
      return <TodayRow key={session.id} session={session} patient={patient} isNext={isNext} first={index === 0} line={line} props={props} />;
    })}
  </HomeCard>;
}
