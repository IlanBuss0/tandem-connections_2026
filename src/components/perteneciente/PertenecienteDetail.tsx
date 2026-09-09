import { useMemo, useState } from 'react';
import {
  Activity, ArrowRight, CalendarDays, Check, CheckCircle2, ClipboardPlus, Clock3, Heart,
  History, MessageCircle, Network, NotebookPen, Sparkles, Target, Users,
} from 'lucide-react';
import type { AcompanamientoData, CalendarEvent, EmotionalRecord, ProfessionalSession, SupportNetworkMember, User } from '@/data/api';

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

function Avatar({ person }: { person: PertenecienteDetailProps['person'] }) {
  const avatar = person.avatar?.trim();
  const isImage = Boolean(avatar && (/^(https?:|data:image\/|\/)/.test(avatar) || /\.(png|jpe?g|webp|svg)$/i.test(avatar)));
  return <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[26px] border-4 border-white bg-[#e9f5ff] text-3xl font-bold text-primary shadow-[0_10px_24px_rgba(55,100,140,.16)] sm:h-24 sm:w-24 sm:text-4xl">
    {isImage ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : avatar || person.name.slice(0, 1)}
  </span>;
}

function Section({ title, eyebrow, icon: Icon, children, className = '' }: { title: string; eyebrow?: string; icon: typeof Heart; children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-[0_14px_34px_rgba(65,76,110,.08)] backdrop-blur sm:p-5 ${className}`}>
    <header className="mb-4 flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon size={19} aria-hidden /></span><div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-primary/75">{eyebrow}</p><h2 className="font-heading text-lg font-bold text-foreground">{title}</h2></div></header>{children}
  </section>;
}

function Empty({ children }: { children: React.ReactNode }) { return <p className="rounded-2xl bg-muted/45 p-4 text-sm text-muted-foreground">{children}</p>; }

export default function PertenecienteDetail({
  person, activities = [], emotions = [], events = [], sessions = [], supportData, supportNetwork = [],
  currentUserId, role, canViewHistory = true, canManageSessions = false, onOpenChat, onOpenCalendar,
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
  const completed = activities.filter(activityIsDone).length;
  const upcoming = useMemo(() => events.filter(event => new Date(`${event.date}T${event.time || '00:00'}`).getTime() >= Date.now() - 3600000).slice(0, 3), [events]);
  const nextSession = sessions.find(session => session.estado === 'programada' && new Date(session.fecha_sesion).getTime() >= Date.now());
  const sharedNotes = supportData?.notas || [];
  const sharedObjectives = supportData?.objetivos || [];
  const activeObjectives = sharedObjectives.filter(objective => objective.estado !== 'completado');
  const historyObjectives = sharedObjectives.filter(objective => objective.estado === 'completado');
  const sharedAgreements = supportData?.acuerdos || [];

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
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center"><Avatar person={person} /><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Centro de acompañamiento</p><h1 className="mt-1 truncate font-heading text-3xl font-bold tracking-tight sm:text-4xl">{person.name}</h1><div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-white/80 px-3 py-1.5 text-muted-foreground">{person.age ? `${person.age} años` : 'Edad sin registrar'}</span><span className="rounded-full bg-emerald-100/80 px-3 py-1.5 text-emerald-800">{person.linkStatus || 'Acompañamiento activo'}</span><span className="rounded-full bg-violet-100/80 px-3 py-1.5 text-violet-800">{role === 'professional' ? 'Profesional vinculado' : 'Tutor vinculado'}</span></div></div><div className="flex flex-wrap gap-2 sm:self-start">{onOpenChat && <button type="button" onClick={onOpenChat} className="flex min-h-11 items-center gap-2 rounded-2xl border border-white bg-white/90 px-3 text-sm font-bold text-primary shadow-sm"><MessageCircle size={17} /> <span className="hidden sm:inline">Conversar</span></button>}{role === 'professional' && onCreateActivity && <button type="button" onClick={onCreateActivity} className="gradient-primary flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-bold text-primary-foreground shadow-sm"><ClipboardPlus size={17} /> <span>Crear actividad</span></button>}</div></div>
      {person.observation && <p className="mt-5 max-w-3xl rounded-2xl border border-primary/10 bg-white/65 p-4 text-sm leading-6 text-muted-foreground"><span className="font-bold text-foreground">Para tener presente · </span>{person.observation}</p>}
    </section>

    <nav aria-label="Secciones del centro" className="grid grid-cols-5 gap-1 rounded-2xl border border-white/80 bg-white/75 p-1 shadow-sm">
      {tabs.map(item => <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`flex min-h-12 items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-bold transition sm:gap-2 sm:px-3 sm:text-sm ${tab === item.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'}`}><item.icon size={15} aria-hidden /><span>{item.label}</span></button>)}
    </nav>

    {tab === 'summary' && <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
      <div className="space-y-5"><section className="rounded-[28px] bg-[#f6fbff] p-5 shadow-inner"><p className="text-sm font-semibold text-primary">Una mirada de esta semana</p><h2 className="mt-2 font-heading text-3xl font-bold">{completed > activities.length / 2 ? 'Semana estable' : 'Acompañamiento en marcha'}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Lo importante es observar pequeños avances y sostener apoyos que le resulten claros y posibles.</p><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3"><MiniStat value={`${completed}/${activities.length}`} label="actividades" icon={CheckCircle2} /><MiniStat value={emotions.length} label="registros emocionales" icon={Heart} /><MiniStat value={upcoming.length} label="próximos momentos" icon={CalendarDays} /></div></section><Section title="Qué pasó recientemente" eyebrow="Señales para conversar" icon={Clock3}><div className="space-y-3">{emotions.slice(0, 3).map(emotion => <div key={emotion.id} className="flex items-start gap-3 rounded-2xl bg-rose-50/60 p-3"><span className="text-2xl" role="img" aria-label={emotion.emotion}>{emotion.emoji || '🙂'}</span><div className="min-w-0"><p className="font-semibold">{emotion.emotion}</p><p className="text-sm text-muted-foreground">{emotion.context || 'Registro emocional compartido.'}</p><p className="mt-1 text-xs text-muted-foreground">{dateLabel(emotion.date)}</p></div></div>)}{!emotions.length && <Empty>Todavía no hay registros emocionales para compartir.</Empty>}</div></Section></div>
      <div className="space-y-5"><Section title="Próximos momentos" eyebrow="Para anticipar" icon={CalendarDays}>{upcoming.length ? <div className="space-y-2">{upcoming.map(event => <button key={event.id} type="button" onClick={onOpenCalendar} className="flex w-full items-center gap-3 rounded-2xl p-2 text-left hover:bg-primary/5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600"><CalendarDays size={19} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{event.title}</span><span className="block text-xs text-muted-foreground">{dateLabel(event.date)}{event.time ? ` · ${event.time}` : ''}</span></span><ArrowRight size={16} className="text-muted-foreground" /></button>)}</div> : <Empty>No hay eventos próximos. Anticipar también puede ser hacer espacio.</Empty>}</Section><button type="button" onClick={() => setTab('ai')} className="w-full rounded-[28px] bg-[linear-gradient(135deg,#7350ad,#9b78d0)] p-5 text-left text-white shadow-[0_14px_30px_rgba(115,80,173,.25)] transition hover:-translate-y-0.5"><span className="text-2xl">✨</span><p className="mt-3 font-heading text-xl font-bold">Preguntale a TÁNDEM</p><p className="mt-1 text-sm text-white/80">Una mirada basada en la información autorizada de {person.name}.</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-bold">Abrir acompañamiento IA <ArrowRight size={16} /></span></button></div>
    </div>}

    {tab === 'evolution' && <div className="grid gap-5 lg:grid-cols-2"><Section title="Cambios que podemos observar" eyebrow="Evolución" icon={Activity}><div className="space-y-4"><EvolutionItem title={person.autonomy || 'Autonomía cotidiana'} before="Necesitaba acompañamiento frecuente." after={completed ? 'Está practicando varios pasos con más confianza.' : 'Estamos construyendo apoyos que le resulten posibles.'} /><EvolutionItem title="Participación" before="El punto de partida cambia con cada persona." after={activities.length ? `Hay ${activities.length} actividades que nos ayudan a observar su recorrido.` : 'Todavía no hay actividades compartidas.'} /></div></Section><Section title="Huellas recientes" eyebrow="Sin métricas frías" icon={Heart}><div className="relative space-y-4 pl-5 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-px before:bg-primary/20">{[...activities.slice(0, 3).map(item => ({ id: `a-${item.id}`, title: item.title, text: activityIsDone(item) ? 'Actividad completada' : 'Actividad en seguimiento', date: item.completedAt })), ...emotions.slice(0, 3).map(item => ({ id: `e-${item.id}`, title: item.emotion, text: item.context || 'Registro emocional', date: item.date }))].slice(0, 5).map(item => <div key={item.id} className="relative rounded-2xl bg-muted/35 p-3 before:absolute before:-left-[1.35rem] before:top-4 before:h-3 before:w-3 before:rounded-full before:border-2 before:border-white before:bg-primary"><p className="font-semibold">{item.title}</p><p className="text-sm text-muted-foreground">{item.text}</p><p className="mt-1 text-xs text-muted-foreground">{dateLabel(item.date)}</p></div>)}{!activities.length && !emotions.length && <Empty>La evolución se construye con registros compartidos.</Empty>}</div></Section></div>}

    {tab === 'collaboration' && <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><div className="space-y-5"><Section title="Notas compartidas" eyebrow="Muro de acompañamiento" icon={NotebookPen}><div className="space-y-3">{sharedNotes.slice(0, 8).map(note => <article key={note.id} className="rounded-2xl border border-border/70 bg-[#fffaf4] p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold">{note.autor_nombre || 'Red de apoyo'} <span className="font-normal text-muted-foreground">· {note.autor_rol || 'Acompañamiento'}</span></p><time className="text-xs text-muted-foreground">{dateLabel(note.fecha_creacion)}</time></div><p className="mt-2 text-sm leading-6">{note.contenido}</p>{onDeleteSharedNote && <button type="button" onClick={() => void onDeleteSharedNote(note.id)} className="mt-2 text-xs font-bold text-muted-foreground hover:text-destructive">Eliminar</button>}</article>)}{!sharedNotes.length && <Empty>Todavía no hay notas compartidas. Las notas privadas profesionales no aparecen aquí.</Empty>} </div>{onCreateSharedNote && <form onSubmit={event => { event.preventDefault(); if (!noteDraft.trim()) return; void onCreateSharedNote(noteDraft.trim()).then(() => setNoteDraft('')); }} className="flex flex-col gap-2 sm:flex-row"><textarea value={noteDraft} onChange={event => setNoteDraft(event.target.value)} placeholder="Compartí una observación útil para la red…" maxLength={2000} className="min-h-20 flex-1 rounded-2xl border border-border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" /><button type="submit" className="min-h-11 rounded-2xl bg-primary px-4 text-sm font-bold text-primary-foreground">Compartir</button></form>}</Section><Section title="En qué estamos trabajando" eyebrow="Objetivos compartidos" icon={Target}><div className="space-y-3">{activeObjectives.map(objective => <ObjectiveCard key={objective.id} objective={objective} editable={role === 'professional' && Boolean(onUpdateObjective)} onUpdate={onUpdateObjective} />)}{!activeObjectives.length && <Empty>Aún no hay objetivos activos.</Empty>}</div>{role === 'professional' && onCreateObjective && <form onSubmit={event => { event.preventDefault(); if (!objectiveDraft.trim()) return; void onCreateObjective({ titulo: objectiveDraft.trim() }).then(() => setObjectiveDraft('')); }} className="mt-3 flex gap-2"><input value={objectiveDraft} onChange={event => setObjectiveDraft(event.target.value)} placeholder="Nuevo objetivo" maxLength={160} className="min-h-11 min-w-0 flex-1 rounded-xl border border-border px-3 text-sm" /><button type="submit" className="rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground">Agregar</button></form>}{historyObjectives.length > 0 && <div className="mt-4"><button type="button" onClick={() => setShowObjectiveHistory(value => !value)} className="flex min-h-9 items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"><History size={14} aria-hidden /> Historial ({historyObjectives.length})</button>{showObjectiveHistory && <div className="mt-2 space-y-2">{historyObjectives.map(objective => <div key={objective.id} className="rounded-2xl bg-emerald-50/70 p-3"><div className="flex items-start justify-between gap-3"><p className="text-sm font-bold text-emerald-950 line-through">{objective.titulo}</p><CheckCircle2 size={16} className="shrink-0 text-emerald-600" aria-hidden /></div><p className="mt-1 text-xs text-emerald-800/80">Completado {dateLabel(objective.fecha_actualizacion)}{objective.autor_nombre ? ` · lo puso ${objective.autor_nombre}` : ''}</p></div>)}</div>}</div>}</Section></div><div className="space-y-5"><Section title="Personas acompañando" eyebrow="Red de apoyo" icon={Users}>{supportNetwork.length ? <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">{supportNetwork.map(member => { const isYou = currentUserId != null && String(member.id_usuario) === String(currentUserId); return <div key={`${member.rol}-${member.id_usuario}`} className={`flex items-center gap-3 rounded-2xl p-3 ${member.rol === 'tutor' ? 'bg-sky-50 text-sky-800' : 'bg-violet-50 text-violet-800'}`}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 text-xs font-bold">{initialsOf(member.nombre)}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-2 truncate text-sm font-bold">{member.nombre}{isYou && <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">Vos</span>}</span><span className="block text-xs capitalize opacity-80">{member.rol}</span></span></div>; })}</div> : <Empty>Todavía no hay tutores ni profesionales vinculados.</Empty>}</Section><Section title="Acuerdos de acompañamiento" eyebrow="Esta semana" icon={CheckCircle2}><div className="space-y-2 text-sm">{sharedAgreements.map(agreement => <label key={agreement.id} className="flex items-start gap-2"><input type="checkbox" checked={agreement.completado} onChange={event => onToggleAgreement && void onToggleAgreement(agreement.id, event.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" /><span className={agreement.completado ? 'text-muted-foreground line-through' : ''}>{agreement.texto}</span></label>)}{!sharedAgreements.length && <Empty>Todavía no hay acuerdos registrados.</Empty>}</div>{onCreateAgreement && <form onSubmit={event => { event.preventDefault(); if (!agreementDraft.trim()) return; void onCreateAgreement(agreementDraft.trim()).then(() => setAgreementDraft('')); }} className="mt-3 flex gap-2"><input value={agreementDraft} onChange={event => setAgreementDraft(event.target.value)} placeholder="Nuevo acuerdo" maxLength={500} className="min-h-11 min-w-0 flex-1 rounded-xl border border-border px-3 text-sm" /><button type="submit" className="rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground">Agregar</button></form>}</Section></div></div>}

    {tab === 'sessions' && <Section title="Sesiones permitidas" eyebrow="Acompañamiento profesional" icon={CalendarDays}><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="max-w-xl text-sm text-muted-foreground">Las notas privadas profesionales quedan protegidas y nunca se muestran en este espacio compartido.</p>{canManageSessions && onScheduleSession && <button type="button" onClick={onScheduleSession} className="min-h-11 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">Programar sesión</button>}</div>{nextSession && <div className="mb-4 rounded-2xl bg-violet-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-violet-700">Próxima sesión</p><p className="mt-1 font-heading text-xl font-bold text-violet-950">{nextSession.titulo}</p><p className="text-sm text-violet-800/75">{new Date(nextSession.fecha_sesion).toLocaleString('es-AR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} · {nextSession.duracion_minutos} min</p></div>} {!canViewHistory ? <Empty>El historial no está habilitado para este vínculo.</Empty> : sessions.length ? <div className="space-y-2">{sessions.slice(0, 8).map(session => <div key={session.id} className="flex items-center gap-3 rounded-2xl border border-border/70 p-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${session.estado === 'completada' ? 'bg-emerald-50 text-emerald-600' : 'bg-violet-50 text-violet-600'}`}><CalendarDays size={18} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{session.titulo}</span><span className="block text-xs text-muted-foreground">{dateLabel(session.fecha_sesion)} · {session.estado}</span></span>{role === 'professional' && session.has_note && onOpenPrivateNote && <button type="button" onClick={() => onOpenPrivateNote(session)} className="min-h-10 rounded-xl px-3 text-xs font-bold text-primary hover:bg-primary/5">Nota privada</button>}</div>)}</div> : <Empty>Todavía no hay sesiones para mostrar.</Empty>}</Section>}

    {tab === 'ai' && <Section title="Preguntale a TÁNDEM" eyebrow="Información autorizada" icon={Sparkles}><div className="max-w-2xl"><p className="text-sm leading-6 text-muted-foreground">La IA puede ayudarte a conectar actividades, emociones, sesiones y objetivos compartidos. No diagnostica ni completa datos que no existan.</p>{onAskAI ? <><div className="mt-4 flex flex-col gap-2 sm:flex-row"><input value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void ask(); }} placeholder="¿Qué querés saber sobre esta persona?" className="min-h-12 flex-1 rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30" /><button type="button" onClick={() => void ask()} disabled={aiLoading || !question.trim()} className="min-h-12 rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50">{aiLoading ? 'Pensando…' : 'Preguntar'}</button></div>{answer && <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-primary/5 p-4 text-sm leading-6">{answer}</p>}</> : <div className="mt-4 rounded-2xl bg-muted/45 p-4 text-sm text-muted-foreground">La conversación IA compartida se habilita cuando el vínculo tenga un proveedor autorizado.</div>}</div></Section>}
  </div>;
}

function MiniStat({ value, label, icon: Icon }: { value: string | number; label: string; icon: typeof Heart }) { return <div className="rounded-2xl bg-white/80 p-3"><Icon size={17} className="text-primary" /><strong className="mt-2 block text-2xl font-bold text-foreground">{value}</strong><span className="text-xs text-muted-foreground">{label}</span></div>; }
function EvolutionItem({ title, before, after }: { title: string; before: string; after: string }) { return <div className="rounded-2xl bg-[#f7f4ff] p-4"><p className="font-bold">{title}</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><div><p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Antes</p><p className="mt-1 text-sm text-muted-foreground">{before}</p></div><div><p className="text-[11px] font-bold uppercase tracking-wider text-primary">Ahora</p><p className="mt-1 text-sm font-semibold">{after}</p></div></div></div>; }
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
