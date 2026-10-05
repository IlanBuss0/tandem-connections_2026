import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, Heart, Lock, Rows3 } from 'lucide-react';
import type { EmotionalRecord, User } from '@/data/api';
import { PatientPickerSheet, type AgendaPatient } from '@/components/agenda/SessionFormSheet';
import PersonSelector from '@/pages/tutor/personas/PersonSelector';
import type { PatientLink } from '@/lib/professionalPatientsModel';
import { localDateKey, MAX_PATIENT_CHIPS, visiblePatients } from '@/lib/agendaFormat';
import { countDaysWithRecord, countRecords, dayTitle, emotionDistribution, groupByDay, monthOf, weekDays } from '@/lib/emotionSummary';
import EmotionWeekStrip from './EmotionWeekStrip';
import EmotionMonthGrid from './EmotionMonthGrid';
import EmotionStats from './EmotionStats';
import EmotionDayDetail from './EmotionDayDetail';

type View = 'week' | 'month';
type Props = {
  patients: User[];
  emotionsByUser: Record<string, EmotionalRecord[]>;
  links: Record<string, PatientLink>;
  loading: boolean;
};

const EASE = [0.2, 0.8, 0.2, 1] as const;
const cardClass = 'rounded-[24px] border border-[#ece3f8] bg-white p-5 text-sm text-[var(--evo-text-secondary)] shadow-[0_8px_24px_#f0e8f8]';

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando registros" className="space-y-4">
      {[96, 72, 140].map(height => <div key={height} style={{ height }} className="animate-pulse rounded-[24px] bg-[#F1EAFB]" />)}
    </div>
  );
}

export default function EmotionalStatusScreen({ patients, emotionsByUser, links, loading }: Props) {
  const reduceMotion = useReducedMotion();
  const today = useMemo(() => localDateKey(new Date()), []);
  const options = useMemo<AgendaPatient[]>(
    () => patients.filter(patient => links[patient.id]).map(patient => ({ ...patient, pertenecienteId: links[patient.id].pertenecienteId })),
    [patients, links],
  );
  const [chosenId, setChosenId] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [view, setView] = useState<View>('week');
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(today);

  const patient = options.find(item => item.pertenecienteId === chosenId) ?? options[0];
  const link = patient ? links[patient.id] : undefined;
  const records = useMemo(() => (link?.canViewHistory && patient ? emotionsByUser[patient.id] ?? [] : []), [link, patient, emotionsByUser]);
  const byDay = useMemo(() => groupByDay(records), [records]);

  const isWeek = view === 'week';
  const month = useMemo(() => monthOf(today, offset), [today, offset]);
  const days = isWeek ? weekDays(today, offset) : month.days;
  const previousDays = isWeek ? weekDays(today, offset + 1) : monthOf(today, offset + 1).days;
  const elapsed = days.filter(day => day <= today);

  const resetPeriod = () => { setOffset(0); setSelected(today); };
  const selectPatient = (id: number) => { setChosenId(id); resetPeriod(); };
  const changeView = () => { setView(isWeek ? 'month' : 'week'); resetPeriod(); };
  const changeOffset = (next: number) => {
    const nextDays = isWeek ? weekDays(today, next) : monthOf(today, next).days;
    setOffset(next);
    if (!nextDays.includes(selected)) setSelected(nextDays.filter(day => day <= today).pop() ?? today);
  };

  const firstName = patient?.name.split(' ')[0] ?? '';
  const stats = {
    daysWithRecord: countDaysWithRecord(elapsed, byDay),
    totalDays: elapsed.length,
    records: countRecords(days, byDay),
    previousRecords: countRecords(previousDays, byDay),
    previousLabel: isWeek ? 'Semana anterior' : 'Mes anterior',
    distribution: emotionDistribution(days, byDay),
  };
  const fade = reduceMotion ? { initial: false as const } : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.24, ease: EASE } };

  const body = () => {
    if (loading) return <Skeleton />;
    if (!patient || !link) return <p className={cardClass}>Todavía no tenés pacientes vinculados.</p>;
    if (!link.canViewHistory) {
      return <p role="status" className={`${cardClass} flex items-center gap-3`}><Lock size={20} aria-hidden className="shrink-0 text-[var(--evo-primary)]" />La familia de {firstName} no habilitó el historial.</p>;
    }
    if (!records.length) return <p className={cardClass}>{firstName} todavía no hizo registros.</p>;
    return (
      <>
        <div className="flex items-center justify-end gap-3">
          <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--evo-text-secondary)]">{isWeek ? 'Vista semanal' : 'Vista mensual'}</span>
          <button
            type="button"
            onClick={changeView}
            aria-label={isWeek ? 'Cambiar a vista mensual' : 'Cambiar a vista semanal'}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--evo-border-1)] bg-white text-[var(--evo-primary-text)] transition-colors hover:bg-[var(--evo-soft-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-primary)]"
          >
            {isWeek ? <CalendarDays size={20} aria-hidden /> : <Rows3 size={20} aria-hidden />}
          </button>
        </div>
        <motion.div key={`${patient.pertenecienteId}-${view}`} {...fade} className="space-y-4">
          {isWeek
            ? <EmotionWeekStrip days={days} offset={offset} byDay={byDay} selected={selected} onSelect={setSelected} onOffset={changeOffset} />
            : <EmotionMonthGrid days={days} label={month.label} today={today} offset={offset} byDay={byDay} selected={selected} onSelect={setSelected} onOffset={changeOffset} />}
          <EmotionStats stats={stats} />
          <EmotionDayDetail title={dayTitle(selected, today)} records={byDay[selected] ?? []} />
        </motion.div>
      </>
    );
  };

  return (
    <div className="evolution-scope mx-auto w-full max-w-[720px] space-y-5">
      <header className="flex items-center gap-3">
        <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-[var(--evo-primary)] text-white"><Heart size={24} /></span>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--evo-primary)]">Estado emocional</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-[var(--evo-text)] sm:text-3xl">Cómo se sintió</h1>
        </div>
      </header>
      {!loading && patient && (
        <PersonSelector
          label="Elegí de quién querés ver los registros"
          people={visiblePatients(options, String(patient.pertenecienteId)).map(item => ({ id: item.pertenecienteId, name: item.name }))}
          selectedId={patient.pertenecienteId}
          onSelect={selectPatient}
          onMore={options.length > MAX_PATIENT_CHIPS ? () => setPickerOpen(true) : undefined}
        />
      )}
      {body()}
      {!loading && <p className="px-1 text-xs text-[var(--evo-text-secondary)]">Son registros que escribió la persona. No es una evaluación ni un diagnóstico.</p>}
      {pickerOpen && <PatientPickerSheet patients={options} onClose={() => setPickerOpen(false)} onPick={id => { selectPatient(Number(id)); setPickerOpen(false); }} />}
    </div>
  );
}
