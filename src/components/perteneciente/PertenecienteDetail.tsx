import { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowRight, CalendarDays, Check, CheckCircle2, ClipboardPlus, Clock3, FileText, Heart,
  History, MessageCircle, Network, NotebookPen, Sparkles, Target, Users,
} from 'lucide-react';
import type { AcompanamientoData, CalendarEvent, EmotionalRecord, GeneratedReport, ProfessionalSession, SupportNetworkMember, User } from '@/data/api';
import { fetchEvolutionReport, type EvolutionWeek } from '@/data/usageApi';
import { ReportItem } from '@/components/TutorReportsPanel';
import { monthKey, reportTime } from '@/lib/reportGrouping';

type DetailTab = 'summary' | 'evolution' | 'collaboration' | 'sessions' | 'ai';

export interface PertenecienteDetailProps {
  person: Pick<User, 'id' | 'name' | 'avatar' | 'age'> & {
    supportLevel?: string;
    autonomy?: string;
    observation?: string;
    linkStatus?: string;
  };
  activities?: Array<{ id: string; title: string; status: string; completed?: boolean; objective?: string; completedAt?: string | null }>;
  emotions?: EmotionalRecord[];
  events?: CalendarEvent[];
  sessions?: ProfessionalSession[];
  supportData?: AcompanamientoData;
  supportNetwork?: SupportNetworkMember[];
  reports?: GeneratedReport[];
  currentUserId?: string | number;
  role: 'tutor' | 'professional';
  canViewHistory?: boolean;
  canManageSessions?: boolean;
  onOpenChat?: () => void;
  onOpenCalendar?: () => void;
  onCreateActivity?: () => void;
  onScheduleSession?: () => void;
  onOpenPrivateNote?: (session: ProfessionalSession) => void;
  onCreateSharedNote?: (content: string) => Promise<void>;
  onDeleteSharedNote?: (noteId: number) => Promise<void>;
  onCreateObjective?: (payload: { titulo: string; descripcion?: string }) => Promise<void>;
  onUpdateObjective?: (objectiveId: number, payload: { progreso?: number; estado?: 'activo' | 'pausado' | 'completado' }) => Promise<void>;
  onCreateAgreement?: (text: string) => Promise<void>;
  onToggleAgreement?: (agreementId: number, completed: boolean) => Promise<void>;
  onAskAI?: (question: string) => Promise<string>;
}

const dateLabel = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
};

const activityIsDone = (item: { completed?: boolean; status?: string }) =>
  item.completed ?? /^completad/i.test(String(item.status ?? ''));

const initialsOf = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('') || '?';

const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

function splitWeeksInHalf(weeks: EvolutionWeek[]) {
  const recentCount = Math.max(1, Math.floor(weeks.length / 2));
  return { earlier: weeks.slice(0, weeks.length - recentCount), recent: weeks.slice(-recentCount) };
}

function trendDirection(delta: number, threshold: number): 1 | 0 | -1 {
  if (delta > threshold) return 1;
  if (delta < -threshold) return -1;
  return 0;
}

function monthCounts(dates: Date[]) {
  const now = new Date();
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = dates.filter(date => date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()).length;
  const lastMonth = dates.filter(date => date.getFullYear() === previous.getFullYear() && date.getMonth() === previous.getMonth()).length;
  return { thisMonth, lastMonth };
}

function mostFrequentEmotion(records: EmotionalRecord[]) {
  if (!records.length) return null;
  const counts = new Map<string, number>();
  records.forEach(record => counts.set(record.emotion, (counts.get(record.emotion) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function isoWeekStart(isoWeek: string): Date | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(isoWeek);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday1 = new Date(jan4);
  monday1.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  const start = new Date(monday1);
  start.setUTCDate(monday1.getUTCDate() + (week - 1) * 7);
  return start;
}

function useEvolutionSummary(userId: string) {
  const [weeks, setWeeks] = useState<EvolutionWeek[] | null>(null);

  useEffect(() => {
    let mounted = true;
    setWeeks(null);
    fetchEvolutionReport(userId).then(result => { if (mounted) setWeeks(result); });
    return () => { mounted = false; };
  }, [userId]);

  const summary = useMemo(() => {
    if (!weeks) return { loading: true as const };
    if (!weeks.length) return { loading: false as const, hasData: false as const };

    const { earlier, recent } = splitWeeksInHalf(weeks);
    const recentSteps = average(recent.map(week => week.routineCompletions));
    const earlierSteps = earlier.length ? average(earlier.map(week => week.routineCompletions)) : null;
    const recentMoodWeeks = recent.filter(week => week.positiveEmotionRatio !== null);
    const earlierMoodWeeks = earlier.filter(week => week.positiveEmotionRatio !== null);
    const recentMood = recentMoodWeeks.length ? average(recentMoodWeeks.map(week => week.positiveEmotionRatio as number)) : null;
    const earlierMood = earlierMoodWeeks.length ? average(earlierMoodWeeks.map(week => week.positiveEmotionRatio as number)) : null;

    return { loading: false as const, hasData: true as const, recentSteps, earlierSteps, recentMood, earlierMood };
  }, [weeks]);

  return { ...summary, weeks: weeks || [] };
}

function Avatar({ person }: { person: PertenecienteDetailProps['person'] }) {
  const avatar = person.avatar?.trim();
  const isImage = Boolean(avatar && (/^(https?:|data:image\/|\/)/.test(avatar) || /\.(png|jpe?g|webp|svg)$/i.test(avatar)));
  return <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[26px] border-4 border-white bg-[#e9f5ff] text-3xl font-bold text-primary shadow-[0_10px_24px_rgba(55,100,140,.16)] sm:h-24 sm:w-24 sm:text-4xl">
    {isImage ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : avatar || '🙂'}
  </span>;
}

function Section({ title, eyebrow, icon: Icon, children, className = '' }: { title: string; eyebrow?: string; icon: typeof Heart; children: React.ReactNode; className?: string }) {
  return <section className={`min-w-0 rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-[0_14px_34px_rgba(65,76,110,.08)] backdrop-blur sm:p-5 ${className}`}>
    <header className="mb-4 flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon size={19} aria-hidden /></span><div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-primary/75">{eyebrow}</p><h2 className="font-heading text-lg font-bold text-foreground">{title}</h2></div></header>{children}
  </section>;
}

function Empty({ children }: { children: React.ReactNode }) { return <p className="rounded-2xl bg-muted/45 p-4 text-sm text-muted-foreground">{children}</p>; }

export default function PertenecienteDetail({
  person, activities = [], emotions = [], events = [], sessions = [], supportData, supportNetwork = [], reports = [],
  currentUserId, role, canViewHistory = true, canManageSessions = false, onOpenChat,
  onCreateActivity, onScheduleSession, onOpenPrivateNote, onCreateSharedNote, onDeleteSharedNote,
  onCreateObjective, onUpdateObjective, onCreateAgreement, onToggleAgreement, onAskAI,
}: PertenecienteDetailProps) {
  const [tab, setTab] = useState<DetailTab>('summary');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [objectiveDraft, setObjectiveDraft] = useState('');
  const [agreementDraft, setAgreementDraft] = useState('');
  const [showObjectiveHistory, setShowObjectiveHistory] = useState(false);
  const evolution = useEvolutionSummary(String(person.id));
  const completed = activities.filter(activityIsDone).length;
  const upcoming = useMemo(() => events.filter(event => new Date(`${event.date}T${event.time || '00:00'}`).getTime() >= Date.now() - 3600000).slice(0, 3), [events]);
  const nextSession = sessions.find(session => session.estado === 'programada' && new Date(session.fecha_sesion).getTime() >= Date.now());
  const sharedNotes = supportData?.notas || [];
  const sharedObjectives = supportData?.objetivos || [];
  const activeObjectives = sharedObjectives.filter(objective => objective.estado !== 'completado');
  const historyObjectives = sharedObjectives.filter(objective => objective.estado === 'completado');
  const sharedAgreements = supportData?.acuerdos || [];
  const supportNetworkSection = <Section title="Personas acompañando" eyebrow="Red de apoyo" icon={Users}>{supportNetwork.length ? <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">{supportNetwork.map(member => { const isYou = currentUserId != null && String(member.id_usuario) === String(currentUserId); return <div key={`${member.rol}-${member.id_usuario}`} className={`flex items-center gap-3 rounded-2xl p-3 ${isYou ? 'bg-violet-50 text-violet-800' : 'bg-muted/40 text-foreground'}`}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 text-xs font-bold">{initialsOf(member.nombre)}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-2 truncate text-sm font-bold">{member.nombre}{isYou && <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">Vos</span>}</span><span className="block text-xs capitalize opacity-80">{member.rol}</span></span></div>; })}</div> : <Empty>Todavía no hay tutores ni profesionales vinculados.</Empty>}</Section>;
  const activityMonthCounts = useMemo(() => monthCounts(
    activities.filter(item => activityIsDone(item) && item.completedAt).map(item => new Date(item.completedAt as string)).filter(date => !Number.isNaN(date.getTime())),
  ), [activities]);
  const sessionMonthCounts = useMemo(() => monthCounts(
    sessions.filter(session => session.estado === 'completada').map(session => new Date(session.fecha_sesion)).filter(date => !Number.isNaN(date.getTime())),
  ), [sessions]);
  const objectiveMonthCounts = useMemo(() => monthCounts(
    historyObjectives.map(objective => new Date(objective.fecha_actualizacion)).filter(date => !Number.isNaN(date.getTime())),
  ), [historyObjectives]);
  const emotionPattern = useMemo(() => {
    const sortedAsc = [...emotions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sortedAsc.length < 4) return null;
    const recentCount = Math.max(1, Math.floor(sortedAsc.length / 2));
    const earlier = mostFrequentEmotion(sortedAsc.slice(0, sortedAsc.length - recentCount));
    const recent = mostFrequentEmotion(sortedAsc.slice(-recentCount));
    return earlier && recent ? { earlier, recent } : null;
  }, [emotions]);
  const sortedReports = useMemo(() => [...reports].sort((a, b) => reportTime(b) - reportTime(a)), [reports]);
  const latestReport = sortedReports[0];
  const reportMonths = useMemo(() => Object.entries(sortedReports.reduce((result, report) => {
    const key = monthKey(report);
    (result[key] ||= []).push(report);
    return result;
  }, {} as Record<string, GeneratedReport[]>)), [sortedReports]);

  const evolutionCopy = useMemo(() => {
    if (evolution.loading || !evolution.hasData) {
      return {
        weeklyHighlight: '',
        stepsDirection: null as 1 | 0 | -1 | null,
        moodDirection: null as 1 | 0 | -1 | null,
        autonomyBefore: 'Todavía no había suficientes semanas registradas para comparar.',
        autonomyAfter: 'Todavía no hay pasos de rutina registrados para calcular esto.',
        participationBefore: 'Todavía no había suficientes registros emocionales para comparar.',
        participationAfter: activities.length ? `Hay ${activities.length} actividades que nos ayudan a observar su recorrido.` : 'Todavía no hay actividades ni emociones compartidas.',
      };
    }
    const { recentSteps, earlierSteps, recentMood, earlierMood } = evolution;
    const highlightParts = [
      recentSteps !== null ? `esta semana hizo unos ${Math.round(recentSteps)} pasos de rutina` : null,
      recentMood !== null ? `${Math.round(recentMood * 10)} de cada 10 registros emocionales fueron positivos` : null,
    ].filter(Boolean);

    const stepsDirection = earlierSteps !== null && recentSteps !== null ? trendDirection(recentSteps - earlierSteps, 0.5) : null;
    const moodDirection = earlierMood !== null && recentMood !== null ? trendDirection((recentMood - earlierMood) * 100, 5) : null;

    return {
      weeklyHighlight: highlightParts.length ? `${highlightParts.join(' y ')}.`.replace(/^./, first => first.toUpperCase()) : '',
      stepsDirection,
      moodDirection,
      autonomyBefore: earlierSteps !== null
        ? `Hace unas semanas hacía unos ${Math.round(earlierSteps)} pasos de rutina por semana.`
        : 'Todavía no había suficientes semanas registradas para comparar.',
      autonomyAfter: recentSteps !== null
        ? `Ahora hace unos ${Math.round(recentSteps)} por semana${stepsDirection !== null ? ` — ${stepsDirection > 0 ? 'un poco más' : stepsDirection < 0 ? 'un poco menos' : 'más o menos igual'} que antes` : ''}.`
        : 'Todavía no hay pasos de rutina registrados para calcular esto.',
      participationBefore: earlierMood !== null
        ? `Hace unas semanas, ${Math.round(earlierMood * 10)} de cada 10 registros emocionales eran positivos.`
        : 'Todavía no había suficientes registros emocionales para comparar.',
      participationAfter: recentMood !== null
        ? `Ahora, ${Math.round(recentMood * 10)} de cada 10 son positivos${moodDirection !== null ? ` — ${moodDirection > 0 ? 'más que antes' : moodDirection < 0 ? 'menos que antes' : 'igual que antes'}` : ''}.`
        : activities.length ? `Hay ${activities.length} actividades que nos ayudan a observar su recorrido.` : 'Todavía no hay actividades ni emociones compartidas.',
    };
  }, [evolution, activities.length]);

  const ask = async () => {
    if (!onAskAI || !question.trim()) return;
    setAiLoading(true); setAnswer('');
    try { setAnswer(await onAskAI(question.trim())); } catch (error) { setAnswer(error instanceof Error ? error.message : 'No pudimos responder ahora.'); } finally { setAiLoading(false); }
  };

  const tabs: { id: DetailTab; label: string; icon: typeof Heart }[] = [
    { id: 'summary', label: 'Resumen', icon: Sparkles },
    { id: 'evolution', label: 'Evolución', icon: Activity },
    { id: 'collaboration', label: 'Colaboración', icon: Network },
    { id: 'sessions', label: 'Sesiones', icon: CalendarDays },
    { id: 'ai', label: 'IA', icon: MessageCircle },
  ];

  return <div className="space-y-5 pb-8">
    <section className="overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,#fff 0%,#eef8ff 58%,#f4efff 100%)] p-5 shadow-[0_18px_42px_rgba(55,88,128,.11)] sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center"><Avatar person={person} /><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Centro de acompañamiento</p><h1 className="mt-1 truncate font-heading text-3xl font-bold tracking-tight sm:text-4xl">{person.name}</h1><div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-white/80 px-3 py-1.5 text-muted-foreground">{person.age ? `${person.age} años` : 'Edad sin registrar'}</span><span className="rounded-full bg-emerald-100/80 px-3 py-1.5 text-emerald-800">{person.linkStatus || 'Acompañamiento activo'}</span><span className="rounded-full bg-violet-100/80 px-3 py-1.5 text-violet-800">{role === 'professional' ? 'Profesional vinculado' : 'Tutor vinculado'}</span></div></div><div className="flex flex-wrap gap-2 sm:self-start">{onOpenChat && <button type="button" onClick={onOpenChat} className="flex min-h-11 items-center gap-2 rounded-2xl border border-white bg-white/90 px-3 text-sm font-bold text-primary shadow-sm"><MessageCircle size={17} /> <span className="hidden sm:inline">Conversar</span></button>}{onCreateActivity && <button type="button" onClick={onCreateActivity} className="gradient-primary flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-bold text-primary-foreground shadow-sm"><ClipboardPlus size={17} /> <span>Crear actividad</span></button>}</div></div>
    </section>

    <nav aria-label="Secciones del centro" className="grid grid-cols-5 gap-1 rounded-2xl border border-white/80 bg-white/75 p-1 shadow-sm">
      {tabs.map(item => <button key={item.id} type="button" onClick={() => setTab(item.id)} aria-label={item.label} className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-1 text-[11px] font-bold transition sm:min-h-12 sm:gap-2 sm:px-3 sm:text-sm ${tab === item.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'}`}><item.icon size={18} aria-hidden /><span className="hidden sm:inline">{item.label}</span></button>)}
    </nav>

    {tab === 'summary' && <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
      <div className="space-y-5"><section className="rounded-[28px] bg-[#f6fbff] p-5 shadow-inner"><p className="text-sm font-semibold text-primary">Una mirada de esta semana</p><h2 className="mt-2 font-heading text-3xl font-bold">{completed > activities.length / 2 ? 'Semana estable' : 'Acompañamiento en marcha'}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{evolutionCopy.weeklyHighlight || 'Lo importante es observar pequeños avances y sostener apoyos que le resulten claros y posibles.'}</p><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3"><MiniStat value={`${completed}/${activities.length}`} label="actividades" icon={CheckCircle2} /><MiniStat value={emotions.length} label="registros emocionales" icon={Heart} /><MiniStat value={upcoming.length} label="próximos momentos" icon={CalendarDays} /></div></section><Section title="Qué pasó recientemente" eyebrow="Señales para conversar" icon={Clock3}><div className="space-y-3">{emotions.slice(0, 3).map(emotion => <div key={emotion.id} className="flex items-start gap-3 rounded-2xl bg-rose-50/60 p-3"><span className="text-2xl" role="img" aria-label={emotion.emotion}>{emotion.emoji || '🙂'}</span><div className="min-w-0"><p className="font-semibold">{emotion.emotion}</p><p className="text-sm text-muted-foreground">{emotion.context || 'Registro emocional compartido.'}</p><p className="mt-1 text-xs text-muted-foreground">{dateLabel(emotion.date)}</p></div></div>)}{!emotions.length && <Empty>Todavía no hay registros emocionales para compartir.</Empty>}</div></Section></div>
      <div className="space-y-5"><Section title="En qué estamos trabajando" eyebrow="Objetivos activos" icon={Target}>{activeObjectives.length ? <div className="space-y-3">{activeObjectives.slice(0, 2).map(objective => <ObjectiveCard key={objective.id} objective={objective} editable={false} />)}{activeObjectives.length > 2 && <button type="button" onClick={() => setTab('collaboration')} className="text-xs font-bold text-primary hover:underline">Ver los {activeObjectives.length} objetivos</button>}</div> : <Empty>Todavía no hay objetivos activos.</Empty>}{nextSession && <p className="mt-4 border-t border-border/60 pt-3 text-sm text-muted-foreground"><span className="font-bold text-foreground">Próxima sesión · </span>{nextSession.titulo}, {new Date(nextSession.fecha_sesion).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}</p>}</Section>{latestReport && <Section title="Último reporte" eyebrow={latestReport.profesional_nombre ? `De ${latestReport.profesional_nombre}` : 'Reporte profesional'} icon={FileText}><p className="text-sm font-bold">{latestReport.titulo || 'Reporte de seguimiento'}</p><p className="mt-1 text-xs text-muted-foreground">{dateLabel(latestReport.fecha_envio || latestReport.fecha_generacion)}</p><p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{latestReport.contenido}</p><button type="button" onClick={() => setTab('sessions')} className="mt-3 text-xs font-bold text-primary hover:underline">Ver los {sortedReports.length} reportes</button></Section>}<button type="button" onClick={() => setTab('ai')} className="w-full rounded-[28px] bg-[linear-gradient(135deg,#7350ad,#9b78d0)] p-5 text-left text-white shadow-[0_14px_30px_rgba(115,80,173,.25)] transition hover:-translate-y-0.5"><span className="text-2xl">✨</span><p className="mt-3 font-heading text-xl font-bold">Preguntale a TÁNDEM</p><p className="mt-1 text-sm text-white/80">Una mirada basada en la información autorizada de {person.name}.</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-bold">Abrir acompañamiento IA <ArrowRight size={16} /></span></button></div>
    </div>}

    {tab === 'evolution' && <Section title="Cambios que podemos observar" eyebrow="Evolución" icon={Activity}>
      <div className="grid gap-4 sm:grid-cols-2">
        <EvolutionCard
          icon={CheckCircle2}
          title={person.autonomy || 'Autonomía cotidiana'}
          direction={evolutionCopy.stepsDirection}
          beforeLabel="Antes" afterLabel="Ahora"
          beforeValue={evolution.hasData ? evolution.earlierSteps : null}
          afterValue={evolution.hasData ? evolution.recentSteps : null}
          beforeText={evolutionCopy.autonomyBefore}
          afterText={evolutionCopy.autonomyAfter}
        />
        <EvolutionCard
          icon={Heart}
          title="Estado de ánimo"
          direction={evolutionCopy.moodDirection}
          beforeLabel="Antes" afterLabel="Ahora"
          beforeValue={evolution.hasData && evolution.earlierMood !== null ? evolution.earlierMood * 100 : null}
          afterValue={evolution.hasData && evolution.recentMood !== null ? evolution.recentMood * 100 : null}
          max={100}
          beforeText={evolutionCopy.participationBefore}
          afterText={evolutionCopy.participationAfter}
        />
        {(activityMonthCounts.thisMonth + activityMonthCounts.lastMonth) > 0 && <EvolutionCard
          icon={ClipboardPlus}
          title="Actividades completadas"
          direction={trendDirection(activityMonthCounts.thisMonth - activityMonthCounts.lastMonth, 0.5)}
          beforeLabel="Mes pasado" afterLabel="Este mes"
          beforeValue={activityMonthCounts.lastMonth} afterValue={activityMonthCounts.thisMonth}
          beforeText={`${activityMonthCounts.lastMonth} ${activityMonthCounts.lastMonth === 1 ? 'actividad completada.' : 'actividades completadas.'}`}
          afterText={`${activityMonthCounts.thisMonth} ${activityMonthCounts.thisMonth === 1 ? 'actividad completada.' : 'actividades completadas.'}`}
        />}
        {(sessionMonthCounts.thisMonth + sessionMonthCounts.lastMonth) > 0 && <EvolutionCard
          icon={CalendarDays}
          title="Sesiones con profesionales"
          direction={trendDirection(sessionMonthCounts.thisMonth - sessionMonthCounts.lastMonth, 0.5)}
          beforeLabel="Mes pasado" afterLabel="Este mes"
          beforeValue={sessionMonthCounts.lastMonth} afterValue={sessionMonthCounts.thisMonth}
          beforeText={`${sessionMonthCounts.lastMonth} ${sessionMonthCounts.lastMonth === 1 ? 'sesión realizada.' : 'sesiones realizadas.'}`}
          afterText={`${sessionMonthCounts.thisMonth} ${sessionMonthCounts.thisMonth === 1 ? 'sesión realizada.' : 'sesiones realizadas.'}`}
        />}
        {(objectiveMonthCounts.thisMonth + objectiveMonthCounts.lastMonth) > 0 && <EvolutionCard
          icon={Target}
          title="Objetivos cumplidos"
          direction={trendDirection(objectiveMonthCounts.thisMonth - objectiveMonthCounts.lastMonth, 0.5)}
          beforeLabel="Mes pasado" afterLabel="Este mes"
          beforeValue={objectiveMonthCounts.lastMonth} afterValue={objectiveMonthCounts.thisMonth}
          beforeText={`${objectiveMonthCounts.lastMonth} ${objectiveMonthCounts.lastMonth === 1 ? 'objetivo cumplido.' : 'objetivos cumplidos.'}`}
          afterText={`${objectiveMonthCounts.thisMonth} ${objectiveMonthCounts.thisMonth === 1 ? 'objetivo cumplido.' : 'objetivos cumplidos.'}`}
        />}
      </div>
      {emotionPattern && <div className="mt-4 flex items-start gap-3 rounded-2xl border border-border/60 bg-white p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Heart size={17} aria-hidden /></span><p className="text-sm text-muted-foreground">{emotionPattern.earlier === emotionPattern.recent
        ? `"${emotionPattern.recent}" sigue siendo la emoción que más se repite, antes y ahora.`
        : `Antes, "${emotionPattern.earlier}" era la emoción que más se repetía. Ahora, "${emotionPattern.recent}" es la más frecuente.`}</p></div>}
      {evolution.weeks.length > 1 && <div className="mt-5 space-y-4 border-t border-border/60 pt-5">
        <WeeklyLineChart title="Pasos de rutina, semana a semana" weeks={evolution.weeks} valueOf={week => week.routineCompletions} formatValue={value => String(Math.round(value))} />
        <WeeklyLineChart title="Ánimo positivo, semana a semana" weeks={evolution.weeks} valueOf={week => week.positiveEmotionRatio !== null ? week.positiveEmotionRatio * 100 : null} formatValue={value => `${Math.round(value)}%`} />
      </div>}
    </Section>}

    {tab === 'collaboration' && <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
      <div className="min-w-0 lg:hidden">{supportNetworkSection}</div>
      <div className="min-w-0 space-y-5"><Section title="Notas compartidas" eyebrow="Muro de acompañamiento" icon={NotebookPen}><div className="space-y-3">{sharedNotes.slice(0, 8).map(note => <article key={note.id} className="rounded-2xl border border-border/70 bg-[#fffaf4] p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold">{note.autor_nombre || 'Red de apoyo'} <span className="font-normal text-muted-foreground">· {note.autor_rol || 'Acompañamiento'}</span></p><time className="text-xs text-muted-foreground">{dateLabel(note.fecha_creacion)}</time></div><p className="mt-2 text-sm leading-6">{note.contenido}</p>{onDeleteSharedNote && <button type="button" onClick={() => void onDeleteSharedNote(note.id)} className="mt-2 text-xs font-bold text-muted-foreground hover:text-destructive">Eliminar</button>}</article>)}{!sharedNotes.length && <Empty>Todavía no hay notas compartidas. Las notas privadas profesionales no aparecen aquí.</Empty>} </div>{onCreateSharedNote && <form onSubmit={event => { event.preventDefault(); if (!noteDraft.trim()) return; void onCreateSharedNote(noteDraft.trim()).then(() => setNoteDraft('')); }} className="flex flex-col gap-2 sm:flex-row"><textarea value={noteDraft} onChange={event => setNoteDraft(event.target.value)} placeholder="Compartí una observación útil para la red…" maxLength={2000} className="min-h-14 flex-1 rounded-2xl border border-border bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" /><button type="submit" className="min-h-9 self-end rounded-2xl bg-primary px-3 text-sm font-bold text-primary-foreground">Compartir</button></form>}</Section><Section title="En qué estamos trabajando" eyebrow="Objetivos compartidos" icon={Target}><div className="space-y-3">{activeObjectives.map(objective => <ObjectiveCard key={objective.id} objective={objective} editable={Boolean(onUpdateObjective)} onUpdate={onUpdateObjective} />)}{!activeObjectives.length && <Empty>Aún no hay objetivos activos.</Empty>}</div>{onCreateObjective && <form onSubmit={event => { event.preventDefault(); if (!objectiveDraft.trim()) return; void onCreateObjective({ titulo: objectiveDraft.trim() }).then(() => setObjectiveDraft('')); }} className="mt-3 flex gap-2"><input value={objectiveDraft} onChange={event => setObjectiveDraft(event.target.value)} placeholder="Nuevo objetivo" maxLength={160} className="min-h-11 min-w-0 flex-1 rounded-xl border border-border px-3 text-sm" /><button type="submit" className="rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground">Agregar</button></form>}{historyObjectives.length > 0 && <div className="mt-4"><button type="button" onClick={() => setShowObjectiveHistory(value => !value)} className="flex min-h-9 items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"><History size={14} aria-hidden /> Historial ({historyObjectives.length})</button>{showObjectiveHistory && <div className="mt-2 space-y-2">{historyObjectives.map(objective => <div key={objective.id} className="rounded-2xl bg-emerald-50/70 p-3"><div className="flex items-start justify-between gap-3"><p className="text-sm font-bold text-emerald-950 line-through">{objective.titulo}</p><CheckCircle2 size={16} className="shrink-0 text-emerald-600" aria-hidden /></div><p className="mt-1 text-xs text-emerald-800/80">Completado {dateLabel(objective.fecha_actualizacion)}{objective.autor_nombre ? ` · lo puso ${objective.autor_nombre}` : ''}</p></div>)}</div>}</div>}</Section></div>
      <div className="min-w-0 space-y-5"><div className="hidden lg:block">{supportNetworkSection}</div><Section title="Acuerdos de acompañamiento" eyebrow="Esta semana" icon={CheckCircle2}><div className="space-y-2 text-sm">{sharedAgreements.map(agreement => <label key={agreement.id} className="flex items-start gap-2"><input type="checkbox" checked={agreement.completado} onChange={event => onToggleAgreement && void onToggleAgreement(agreement.id, event.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" /><span className={agreement.completado ? 'text-muted-foreground line-through' : ''}>{agreement.texto}</span></label>)}{!sharedAgreements.length && <Empty>Todavía no hay acuerdos registrados.</Empty>}</div>{onCreateAgreement && <form onSubmit={event => { event.preventDefault(); if (!agreementDraft.trim()) return; void onCreateAgreement(agreementDraft.trim()).then(() => setAgreementDraft('')); }} className="mt-3 flex gap-2"><input value={agreementDraft} onChange={event => setAgreementDraft(event.target.value)} placeholder="Nuevo acuerdo" maxLength={500} className="min-h-11 min-w-0 flex-1 rounded-xl border border-border px-3 text-sm" /><button type="submit" className="rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground">Agregar</button></form>}</Section></div>
    </div>}

    {tab === 'sessions' && <div className="grid gap-5 lg:grid-cols-2"><Section title="Sesiones permitidas" eyebrow="Acompañamiento profesional" icon={CalendarDays}><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="max-w-xl text-sm text-muted-foreground">Las notas privadas profesionales quedan protegidas y nunca se muestran en este espacio compartido.</p>{canManageSessions && onScheduleSession && <button type="button" onClick={onScheduleSession} className="min-h-11 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">Programar sesión</button>}</div>{nextSession && <div className="mb-4 rounded-2xl bg-violet-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-violet-700">Próxima sesión</p><p className="mt-1 font-heading text-xl font-bold text-violet-950">{nextSession.titulo}</p><p className="text-sm text-violet-800/75">{new Date(nextSession.fecha_sesion).toLocaleString('es-AR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} · {nextSession.duracion_minutos} min</p></div>} {!canViewHistory ? <Empty>El historial no está habilitado para este vínculo.</Empty> : sessions.length ? <div className="space-y-2">{sessions.slice(0, 8).map(session => <div key={session.id} className="flex items-center gap-3 rounded-2xl border border-border/70 p-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${session.estado === 'completada' ? 'bg-emerald-50 text-emerald-600' : 'bg-violet-50 text-violet-600'}`}><CalendarDays size={18} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{session.titulo}</span><span className="block text-xs text-muted-foreground">{dateLabel(session.fecha_sesion)} · {session.estado}</span></span>{role === 'professional' && session.has_note && onOpenPrivateNote && <button type="button" onClick={() => onOpenPrivateNote(session)} className="min-h-10 rounded-xl px-3 text-xs font-bold text-primary hover:bg-primary/5">Nota privada</button>}</div>)}</div> : <Empty>Todavía no hay sesiones para mostrar.</Empty>}</Section><Section title="Reportes" eyebrow="Enviados por profesionales" icon={FileText}>{reportMonths.length ? <div className="space-y-3">{reportMonths.map(([month, monthReports], index) => <details key={month} open={index === 0} className="group overflow-hidden rounded-2xl border border-border/70 bg-white"><summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold capitalize">{month}</span><span className="block text-xs text-muted-foreground">{monthReports.length} {monthReports.length === 1 ? 'reporte' : 'reportes'}</span></span></summary><div className="border-t border-border/60 px-3">{monthReports.map(report => <ReportItem key={report.id} report={report} />)}</div></details>)}</div> : <Empty>Todavía no hay reportes para mostrar acá.</Empty>}</Section></div>}

    {tab === 'ai' && <Section title="Preguntale a TÁNDEM" eyebrow="Información autorizada" icon={Sparkles}><div className="max-w-2xl"><p className="text-sm leading-6 text-muted-foreground">La IA puede ayudarte a conectar actividades, emociones, sesiones y objetivos compartidos. No diagnostica ni completa datos que no existan.</p>{onAskAI ? <><div className="mt-4 flex flex-col gap-2 sm:flex-row"><input value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void ask(); }} placeholder="¿Qué querés saber sobre esta persona?" className="min-h-12 flex-1 rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30" /><button type="button" onClick={() => void ask()} disabled={aiLoading || !question.trim()} className="min-h-12 rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50">{aiLoading ? 'Pensando…' : 'Preguntar'}</button></div>{answer && <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-primary/5 p-4 text-sm leading-6">{answer}</p>}</> : <div className="mt-4 rounded-2xl bg-muted/45 p-4 text-sm text-muted-foreground">La conversación IA compartida se habilita cuando el vínculo tenga un proveedor autorizado.</div>}</div></Section>}
  </div>;
}

function MiniStat({ value, label, icon: Icon }: { value: string | number; label: string; icon: typeof Heart }) { return <div className="rounded-2xl bg-white/80 p-3"><Icon size={17} className="text-primary" /><strong className="mt-2 block text-2xl font-bold text-foreground">{value}</strong><span className="text-xs text-muted-foreground">{label}</span></div>; }
function TrendBadge({ direction }: { direction: 1 | 0 | -1 | null }) {
  if (direction === null) return <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">Sin datos aún</span>;
  if (direction === 1) return <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Mejoró</span>;
  if (direction === -1) return <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">Necesita más apoyo</span>;
  return <span className="shrink-0 rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-bold text-sky-700">Se mantiene</span>;
}

function EvolutionCard({ icon: Icon, title, direction, beforeLabel, afterLabel, beforeValue, afterValue, beforeText, afterText, max }: {
  icon: typeof Heart; title: string; direction: 1 | 0 | -1 | null;
  beforeLabel: string; afterLabel: string; beforeValue: number | null; afterValue: number | null;
  beforeText: string; afterText: string; max?: number;
}) {
  const hasBars = beforeValue !== null && afterValue !== null;
  const scale = Math.max(max ?? 0, beforeValue ?? 0, afterValue ?? 0, 1);
  return <div className="rounded-2xl border border-border/60 bg-white p-4">
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={17} aria-hidden /></span><p className="min-w-0 truncate text-sm font-bold">{title}</p></div>
      <TrendBadge direction={direction} />
    </div>
    <div className="mt-3 grid grid-cols-2 gap-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{beforeLabel}</p>
        {hasBars && <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted/50"><div className="h-full rounded-full bg-muted-foreground/40" style={{ width: `${Math.min(100, ((beforeValue as number) / scale) * 100)}%` }} /></div>}
        <p className="mt-1.5 text-sm text-muted-foreground">{beforeText}</p>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary">{afterLabel}</p>
        {hasBars && <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted/50"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, ((afterValue as number) / scale) * 100)}%` }} /></div>}
        <p className="mt-1.5 text-sm font-semibold">{afterText}</p>
      </div>
    </div>
  </div>;
}
function WeeklyLineChart({ title, weeks, valueOf, formatValue }: {
  title: string; weeks: EvolutionWeek[];
  valueOf: (week: EvolutionWeek) => number | null;
  formatValue: (value: number) => string;
}) {
  const points = weeks.map(week => ({ key: week.week, value: valueOf(week), date: isoWeekStart(week.week) }));
  const values = points.map(point => point.value).filter((value): value is number => value !== null);
  const lastIndex = points.length - 1;

  if (!values.length) {
    return <div className="rounded-2xl border border-border/60 bg-white p-4">
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">Todavía no hay datos suficientes para este gráfico.</p>
    </div>;
  }

  const max = Math.max(1, ...values);
  const xFor = (index: number) => (lastIndex > 0 ? (index / lastIndex) * 100 : 50);
  const yFor = (value: number) => 92 - (value / max) * 76;

  const segments: string[] = [];
  let open = false;
  points.forEach((point, index) => {
    if (point.value === null) { open = false; return; }
    const command = `${xFor(index)} ${yFor(point.value)}`;
    if (!open) { segments.push(`M ${command}`); open = true; }
    else segments[segments.length - 1] += ` L ${command}`;
  });

  const lastPoint = points[lastIndex];

  return <div className="rounded-2xl border border-border/60 bg-white p-4">
    <p className="text-sm font-bold text-foreground">{title}</p>
    <div className="relative mt-5 h-28">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
        <line x1="0" y1="92" x2="100" y2="92" className="stroke-border" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        {segments.map((d, index) => <path key={index} d={d} fill="none" className="stroke-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />)}
      </svg>
      {points.map((point, index) => point.value !== null && <span
        key={point.key}
        className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow-sm"
        style={{ left: `${xFor(index)}%`, top: `${yFor(point.value)}%` }}
      />)}
      {lastPoint.value !== null && <span
        className="absolute -translate-x-1/2 -translate-y-[130%] whitespace-nowrap rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-semibold text-background"
        style={{ left: `${xFor(lastIndex)}%`, top: `${yFor(lastPoint.value)}%` }}
      >{formatValue(lastPoint.value)}</span>}
    </div>
    <div className="mt-1 flex">
      {points.map(point => <span key={point.key} className="flex-1 text-center text-[11px] text-muted-foreground">{point.date ? point.date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : ''}</span>)}
    </div>
  </div>;
}
function ObjectiveCard({ objective, editable, onUpdate }: { objective: NonNullable<PertenecienteDetailProps['supportData']>['objetivos'][number]; editable: boolean; onUpdate?: PertenecienteDetailProps['onUpdateObjective'] }) {
  const [value, setValue] = useState(objective.progreso);
  const [saving, setSaving] = useState(false);
  const dirty = value !== objective.progreso;
  const commit = async (next: number, estado?: 'activo' | 'completado') => {
    if (!onUpdate) return;
    setSaving(true);
    try { await onUpdate(objective.id, estado ? { progreso: next, estado } : { progreso: next }); }
    finally { setSaving(false); }
  };
  return <div className="rounded-2xl bg-amber-50/70 p-4">
    <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-amber-950">{objective.titulo}</p>{objective.descripcion && <p className="mt-1 text-sm text-amber-900/70">{objective.descripcion}</p>}</div><span className="text-xs font-bold text-amber-800">{value}%</span></div>
    {editable ? <>
      <input type="range" min={0} max={100} step={5} value={value} disabled={saving} onChange={event => setValue(Number(event.target.value))} onPointerUp={() => { if (value !== objective.progreso) void commit(value); }} onKeyUp={() => { if (value !== objective.progreso) void commit(value); }} aria-label={`Progreso de ${objective.titulo}`} className="mt-3 w-full accent-primary" />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" disabled={saving} onClick={() => void commit(100, 'completado')} className="min-h-9 rounded-xl bg-white px-3 text-xs font-bold text-primary disabled:opacity-50">Completar</button>
        {dirty && <button type="button" disabled={saving} onClick={() => void commit(value)} className="min-h-9 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground disabled:opacity-50">Guardar {value}%</button>}
      </div>
    </> : <div className="mt-3 h-2 overflow-hidden rounded-full bg-amber-200/70"><div className="h-full rounded-full bg-amber-500" style={{ width: `${objective.progreso}%` }} /></div>}
  </div>;
}
