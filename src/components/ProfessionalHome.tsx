import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, CalendarDays, ChevronRight, FileText, Heart, Users } from 'lucide-react';
import type { Activity as PatientActivity, EmotionalRecord, PersonalNote, ProfessionalSession, User } from '@/data/api';
import HomeGreeting from '@/components/professional/home/HomeGreeting';
import HomeToday from '@/components/professional/home/HomeToday';
import HomeAttention from '@/components/professional/home/HomeAttention';
import HomeCloseMonth from '@/components/professional/home/HomeCloseMonth';
import HomeWeek from '@/components/professional/home/HomeWeek';
import { Pressable, SectionTitle } from '@/components/professional/home/HomeUi';
import { useHomeSupport } from '@/components/professional/home/useHomeSupport';
import { useScrollToSection } from '@/components/professional/home/useScrollToSection';
import { attentionItems, buildWeek, nextTodaySession, sessionsWithoutNote, todaySessions, unsentReportsThisMonth } from '@/components/professional/home/homeData';

type HomeTab = 'patients' | 'calendar' | 'documents' | 'reports';
export type ProfessionalHomeProps = {
  professionalName: string;
  patients: User[];
  sessions: ProfessionalSession[];
  activitiesByUser: Record<string, PatientActivity[]>;
  emotionsByUser: Record<string, EmotionalRecord[]>;
  notesByUser: Record<string, PersonalNote[]>;
  patientPertenecienteIds: Record<string, number>;
  onNavigate: (tab: HomeTab) => void;
  onOpenPatient: (userId: string) => void;
  onPrepareSession: (session: ProfessionalSession) => void;
  onWriteNote: (session: ProfessionalSession) => void;
  onSchedule: (userId: string) => void;
  unscheduledUserIds: string[];
  canOpenAgenda: boolean;
};

function avatar(user?: User, size = 'h-8 w-8') {
  if (!user) return <span className={`${size} rounded-full bg-muted`} aria-hidden />;
  const value = user.avatar?.trim();
  const image = value && (/^(https?:|data:image\/|\/)/.test(value) || /\.(png|jpe?g|webp|svg)$/i.test(value));
  return <span className={`inline-flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary`} aria-hidden>{image ? <img src={value} alt="" loading="lazy" className="h-full w-full object-cover" /> : value || user.name.slice(0, 1)}</span>;
}

function parseTime(value?: string) { const time = Date.parse(value || ''); return Number.isFinite(time) ? time : 0; }
function relative(value: string) { const diff = Math.max(0, Date.now() - parseTime(value)); const hours = Math.floor(diff / 3_600_000); return hours < 1 ? 'Recién' : hours < 24 ? `Hace ${hours} h` : hours < 48 ? 'Ayer' : `Hace ${Math.floor(hours / 24)} días`; }

function useMinuteClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(timer); }, []);
  return now;
}

export default function ProfessionalHome(props: ProfessionalHomeProps) {
  const now = useMinuteClock();
  const scrollTo = useScrollToSection();
  const patientOf = useCallback((session: ProfessionalSession) => props.patients.find(patient => props.patientPertenecienteIds[patient.id] === Number(session.id_perteneciente)), [props.patients, props.patientPertenecienteIds]);
  const today = useMemo(() => todaySessions(props.sessions, now), [props.sessions, now]);
  const todayUserIds = useMemo(() => [...new Set(today.flatMap(session => patientOf(session)?.id ?? []))], [today, patientOf]);
  const { agreements, usage, reports } = useHomeSupport({ pertenecienteIds: props.patientPertenecienteIds, todayUserIds });
  const missingNotes = useMemo(() => sessionsWithoutNote(props.sessions, now), [props.sessions, now]);
  const unsentReports = useMemo(() => unsentReportsThisMonth(reports, now), [reports, now]);
  const week = useMemo(() => buildWeek(props.sessions, now), [props.sessions, now]);
  const attention = { patients: props.patients, now, notesByUser: props.notesByUser, agreements, unscheduledUserIds: props.unscheduledUserIds };

  return <div className="mx-auto w-full max-w-[1200px] text-[#2B2145]">
    <HomeGreeting name={props.professionalName} now={now} todayCount={today.length} missingNotes={missingNotes.length} onGoToday={() => scrollTo('home-hoy')} onGoClose={() => scrollTo('home-cerrar')} />
    <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] lg:items-start lg:gap-x-7">
      <div className="contents lg:block">
        <div id="home-hoy" className="order-1">
          <SectionTitle action={props.canOpenAgenda ? <Pressable onClick={() => props.onNavigate('calendar')} className="inline-flex min-h-[44px] items-center gap-1 text-[13px] font-extrabold text-[#553588]">Agenda<ChevronRight size={15} strokeWidth={2.6} aria-hidden /></Pressable> : undefined}>Hoy</SectionTitle>
          <HomeToday sessions={today} next={nextTodaySession(today, now)} now={now} patientOf={patientOf} agreements={agreements} usage={usage} onOpenPatient={props.onOpenPatient} onPrepareSession={props.onPrepareSession} onWriteNote={props.onWriteNote} />
        </div>
        <div className="order-4"><SectionTitle>Esta semana</SectionTitle><HomeWeek week={week} /></div>
      </div>
      <div className="contents lg:block">
        {attentionItems(attention).length > 0 && <div className="order-2"><SectionTitle>Necesitan tu mirada</SectionTitle><HomeAttention {...attention} onOpenPatient={props.onOpenPatient} onSchedule={props.onSchedule} /></div>}
        <div id="home-cerrar" className="order-3"><SectionTitle>Para cerrar el mes</SectionTitle><HomeCloseMonth missingNotes={missingNotes} reports={unsentReports} now={now} patientOf={patientOf} onWriteNote={props.onWriteNote} onReviewReports={() => props.onNavigate('reports')} /></div>
      </div>
    </div>
  </div>;
}

export function ProfessionalRecentActivity({ patients, emotionsByUser, notesByUser, onOpenPatient }: Pick<ProfessionalHomeProps, 'patients' | 'emotionsByUser' | 'notesByUser' | 'onOpenPatient'>) {
  const emotions = Object.entries(emotionsByUser).flatMap(([userId, rows]) => rows.map(row => ({ ...row, patient: patients.find(item => item.id === userId)! }))).filter(item => item.patient);
  const notes = Object.entries(notesByUser).flatMap(([userId, rows]) => rows.map(row => ({ ...row, patient: patients.find(item => item.id === userId)! }))).filter(item => item.patient);
  const recent = [...emotions.slice(0, 8).map(item => ({ id: `emotion-${item.id}`, title: `Registró ${item.emotion.toLowerCase()}`, detail: 'Registro emocional', date: `${item.date}T${item.timestamp || '12:00'}`, patient: item.patient, icon: Heart, tone: 'bg-primary/10 text-primary' })), ...notes.slice(0, 8).map(item => ({ id: `note-${item.id}`, title: item.title || 'Actualizó una nota personal', detail: 'Nota compartida', date: item.createdAt, patient: item.patient, icon: FileText, tone: 'bg-primary/10 text-primary' }))].sort((a, b) => parseTime(b.date) - parseTime(a.date));
  return <div className="space-y-5"><PageHeading title="Actividad reciente" subtitle="Últimos registros y notas compartidas por tus pacientes." /><Card title="Actividad reciente" icon={Activity}><div className="divide-y divide-border">{recent.map(item => <button key={item.id} type="button" onClick={() => onOpenPatient(item.patient.id)} aria-label={`${item.title}. Abrir perfil de ${item.patient.name}`} className="flex min-h-16 w-full items-center gap-3 py-3 text-left hover:bg-primary/[.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${item.tone}`}><item.icon size={19} aria-hidden /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{item.title}</span><span className="block truncate text-xs text-muted-foreground">{item.detail}</span></span><Person patient={item.patient} /><span className="hidden text-xs text-muted-foreground sm:block">{relative(item.date)}</span></button>)}{!recent.length && <SmallEmpty text="Sin actividad reciente disponible." />}</div></Card></div>;
}

function PageHeading({ title, subtitle }: { title: string; subtitle: string }) { return <header><h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1><p className="mt-2 text-sm text-muted-foreground sm:text-base">{subtitle}</p></header>; }

function Card({ title, icon: Icon, action, onAction, children }: { title: string; icon: typeof Users; action?: string; onAction?: () => void; children: React.ReactNode }) { return <section className="rounded-[20px] border border-[#ece3f8] bg-white p-3.5 shadow-[0_8px_24px_#f0e8f8] sm:p-5 md:rounded-[24px]"><header className="mb-2.5 flex items-center gap-2.5 md:mb-4 md:gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary md:h-10 md:w-10 md:rounded-2xl"><Icon size={18} className="md:h-5 md:w-5" aria-hidden /></span><h2 className="min-w-0 flex-1 text-base font-bold text-[#2e2344] md:text-lg">{title}</h2>{action && <button type="button" onClick={onAction} className="min-h-10 rounded-xl px-2 text-xs font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-11 md:text-sm">{action}</button>}</header>{children}</section>; }
function Person({ patient }: { patient?: User }) { return patient ? <span className="inline-flex max-w-28 items-center gap-1.5 rounded-full bg-primary/[.065] py-1 pl-1 pr-2 text-xs font-semibold text-primary">{avatar(patient, 'h-6 w-6')}<span className="truncate">{patient.name.split(' ')[0]}</span></span> : <span className="text-xs text-muted-foreground">Paciente</span>; }
function SmallEmpty({ text }: { text: string }) { return <p className="rounded-2xl border border-dashed border-border p-3 text-sm text-muted-foreground">{text}</p>; }
