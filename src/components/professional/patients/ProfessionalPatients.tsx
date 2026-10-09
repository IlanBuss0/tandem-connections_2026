import { useEffect, useMemo, useState } from 'react';
import { Check, Link as LinkIcon, Mic, Search, Users } from 'lucide-react';
import type { PermissionContext, ProfessionalSession, User } from '@/data/api';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import { HomeButton, HomeCard, Pressable, SectionTitle } from '@/components/professional/home/HomeUi';
import { useHomeSupport } from '@/components/professional/home/useHomeSupport';
import PatientRow from './PatientRow';
import LinkPatientSheet from './LinkPatientSheet';
import { buildPatientItems, buildPatientLinks, filterAndSortPatients, type PatientSort } from '@/lib/professionalPatientsModel';
import { plural } from '@/components/professional/home/homeData';
import { cn } from '@/lib/utils';

const NO_TODAY_USERS: string[] = [];
const SORTS: { id: PatientSort; label: string }[] = [
  { id: 'next', label: 'Próxima sesión' },
  { id: 'news', label: 'Con novedades' },
  { id: 'az', label: 'A–Z' },
];
const EMPTY_TEXT: Record<PatientSort, string> = {
  next: 'No encontramos a ese paciente.',
  az: 'No encontramos a ese paciente.',
  news: 'No hay pacientes con novedades.',
};

type Props = {
  patients: User[];
  sessions: ProfessionalSession[];
  permissionContext: PermissionContext | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenPatient: (userId: string) => void;
  onSchedule: (userId: string) => void;
  onLinkWithCode: (code: string) => Promise<void>;
};

function useMinuteClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

function Skeleton() {
  return <div aria-busy="true" aria-label="Cargando pacientes" className="space-y-1">
    {[0, 1, 2].map(index => <div key={index} className="flex items-center gap-3 py-3"><div className="h-[46px] w-[46px] animate-pulse rounded-full bg-[#F1EAFB]" /><div className="flex-1 space-y-2"><div className="h-3.5 w-1/2 animate-pulse rounded-lg bg-[#F1EAFB]" /><div className="h-3 w-1/3 animate-pulse rounded-lg bg-[#F5F0FC]" /></div></div>)}
  </div>;
}

export default function ProfessionalPatients({ patients, sessions, permissionContext, loading, error, onRetry, onOpenPatient, onSchedule, onLinkWithCode }: Props) {
  const now = useMinuteClock();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<PatientSort>('next');
  const [sheetOpen, setSheetOpen] = useState(false);
  const voice = useVoiceSearch(setQuery);

  const links = useMemo(() => buildPatientLinks(permissionContext, patients), [permissionContext, patients]);
  // Solo se pide acompañamiento de quienes tienen el historial habilitado.
  const pertenecienteIds = useMemo(
    () => Object.fromEntries(Object.entries(links).filter(([, link]) => link.canViewHistory).map(([userId, link]) => [userId, link.pertenecienteId])),
    [links],
  );
  const { agreements } = useHomeSupport({ pertenecienteIds, todayUserIds: NO_TODAY_USERS });

  const items = useMemo(() => buildPatientItems({ patients, sessions, links, acompanamiento: agreements, now }), [patients, sessions, links, agreements, now]);
  const visible = useMemo(() => filterAndSortPatients(items, query, sort), [items, query, sort]);
  const showSkeleton = loading && patients.length === 0;

  return <div className="w-full">
    <header className="mt-1 flex items-center gap-3.5">
      <span aria-hidden className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[20px] bg-[#6F4CA6] text-white md:h-16 md:w-16 md:rounded-[24px]"><Users size={26} strokeWidth={2} className="md:h-8 md:w-8" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-extrabold uppercase tracking-[.12em] text-[#6F4CA6] md:text-[13px]">Pacientes</p>
        <h1 className="mt-[3px] font-heading text-[25px] font-extrabold leading-[1.12] text-[#2B2145] md:text-[36px]">Tus pacientes</h1>
      </div>
      <HomeButton onClick={() => setSheetOpen(true)} className="border-[1.5px] border-[#DACBF0] bg-white md:min-h-[52px] md:px-6 md:text-[15px]"><LinkIcon size={17} strokeWidth={2.4} aria-hidden />Vincular</HomeButton>
    </header>

    <div role="search" className="mt-4 flex min-h-[50px] items-center gap-2.5 rounded-[18px] border-[1.5px] border-[#E6DCF5] bg-white pl-4 pr-1 text-[14.5px] md:mt-6 md:min-h-[58px] md:text-[16px] text-[#756B86] focus-within:border-[#6F4CA6]">
      <Search size={19} strokeWidth={2.4} className="shrink-0 text-[#553588]" aria-hidden />
      <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar paciente" aria-label="Buscar paciente" className="min-w-0 flex-1 bg-transparent py-3 text-[#2B2145] outline-none placeholder:text-[#756B86]" />
      {voice.supported && <Pressable onClick={voice.listening ? voice.stop : voice.start} aria-label={voice.listening ? 'Dejar de escuchar' : 'Buscar por voz'} className={cn('inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full', voice.listening ? 'bg-[#F1EAFB] text-[#6F4CA6]' : 'text-[#675E78]')}><Mic size={18} strokeWidth={2.2} aria-hidden /></Pressable>}
    </div>

    <div className="mt-2.5 flex flex-wrap gap-2 md:mt-4">
      {SORTS.map(option => {
        const active = sort === option.id;
        return <Pressable key={option.id} onClick={() => setSort(option.id)} aria-pressed={active} className={cn('inline-flex min-h-[44px] items-center gap-1.5 rounded-full border-[1.5px] px-3 text-[13px] font-bold transition-colors duration-200', active ? 'border-[#6F4CA6] bg-[#F1EAFB] text-[#553588]' : 'border-[#E6DCF5] bg-white text-[#675E78]')}>
          {active && <Check size={14} strokeWidth={3} aria-hidden />}{option.label}
        </Pressable>;
      })}
    </div>

    {error && <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 rounded-[18px] border border-destructive/20 bg-white p-4 text-[13px] font-semibold text-destructive">{error}<HomeButton onClick={onRetry}>Reintentar</HomeButton></div>}

    {!showSkeleton && patients.length > 0 && <SectionTitle>{plural(visible.length, 'paciente', 'pacientes')}</SectionTitle>}
    {(showSkeleton || patients.length > 0 || !error) && <HomeCard className={cn('p-[14px] md:border-0 md:bg-transparent md:p-0 md:shadow-none', showSkeleton || patients.length > 0 ? '' : 'mt-6')}>
      {showSkeleton && <Skeleton />}
      {!showSkeleton && patients.length === 0 && <div className="py-4 text-center"><p className="text-[14px] font-bold text-[#2B2145]">Todavía no tenés pacientes vinculados.</p><HomeButton primary onClick={() => setSheetOpen(true)} className="mt-3"><LinkIcon size={17} strokeWidth={2.4} aria-hidden />Vincular</HomeButton></div>}
      {!showSkeleton && patients.length > 0 && visible.length === 0 && <p className="py-4 text-center text-[13px] font-semibold text-[#675E78]">{EMPTY_TEXT[sort]}</p>}
      {visible.length > 0 && <ul className="md:grid md:grid-cols-2 md:gap-4 xl:grid-cols-3">{visible.map((item, index) => <PatientRow key={item.patient.id} item={item} now={now} first={index === 0} onOpen={onOpenPatient} onSchedule={onSchedule} />)}</ul>}
    </HomeCard>}

    <LinkPatientSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onSubmit={onLinkWithCode} />
  </div>;
}
