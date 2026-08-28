import { Activity, CalendarDays, CheckCircle2, ChevronRight, FileText, FolderOpen, Heart, Users } from 'lucide-react';
import type { Activity as PatientActivity, EmotionalRecord, PersonalNote, ProfessionalSession, User } from '@/data/api';

type HomeTab = 'patients' | 'calendar' | 'documents';
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
};

function avatar(user?: User, size = 'h-8 w-8') {
  if (!user) return <span className={`${size} rounded-full bg-muted`} aria-hidden />;
  const value = user.avatar?.trim();
  const image = value && (/^(https?:|data:image\/|\/)/.test(value) || /\.(png|jpe?g|webp|svg)$/i.test(value));
  return <span className={`inline-flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary`} aria-hidden>{image ? <img src={value} alt="" loading="lazy" className="h-full w-full object-cover" /> : value || user.name.slice(0, 1)}</span>;
}

function parseTime(value?: string) { const time = Date.parse(value || ''); return Number.isFinite(time) ? time : 0; }
function relative(value: string) { const diff = Math.max(0, Date.now() - parseTime(value)); const hours = Math.floor(diff / 3_600_000); return hours < 1 ? 'Recién' : hours < 24 ? `Hace ${hours} h` : hours < 48 ? 'Ayer' : `Hace ${Math.floor(hours / 24)} días`; }

export default function ProfessionalHome(props: ProfessionalHomeProps) {
  const byPerteneciente = new Map(Object.entries(props.patientPertenecienteIds).map(([userId, id]) => [id, props.patients.find(patient => patient.id === userId)]));
  const upcoming = props.sessions.filter(session => session.estado === 'programada' && parseTime(session.fecha_sesion) >= Date.now() - 3_600_000).sort((a, b) => a.fecha_sesion.localeCompare(b.fecha_sesion));
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = upcoming.filter(session => session.fecha_sesion.slice(0, 10) === today).length;
  const totalActivities = Object.values(props.activitiesByUser).flat();
  const completedActivities = totalActivities.filter(activity => activity.status === 'completada').length;
  const adherence = totalActivities.length ? Math.round(completedActivities / totalActivities.length * 100) : null;
  const notes = Object.entries(props.notesByUser).flatMap(([userId, rows]) => rows.map(row => ({ ...row, patient: props.patients.find(item => item.id === userId)! }))).filter(item => item.patient).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return <div className="space-y-4 md:space-y-6">
    <header className="rounded-[24px] border border-[#e8dcf8] bg-gradient-to-br from-[#f9f4ff] via-[#f4ebff] to-[#eef8fb] px-4 py-5 shadow-[0_10px_30px_#eadff6] sm:px-8 sm:py-9"><h1 className="font-heading text-2xl font-black tracking-tight text-[#2e2344] sm:text-4xl">Hola, Lic. {props.professionalName.replace(/^Lic\.?\s*/i, '').split(' ')[0]}</h1><p className="mt-1.5 max-w-2xl text-xs leading-5 text-[#675a78] sm:mt-2 sm:text-base sm:leading-6">Organizá tus pacientes, sesiones y recursos en un solo lugar.</p></header>

    <section aria-label="Áreas principales" className="grid gap-3 md:grid-cols-3 md:gap-4">
      <NavigationCard icon={Users} title="Pacientes" text={`${props.patients.length} ${props.patients.length === 1 ? 'paciente vinculado' : 'pacientes vinculados'}`} onClick={() => props.onNavigate('patients')}>
        <div className="flex -space-x-2">{props.patients.slice(0, 5).map(patient => <span key={patient.id} className="rounded-full border-2 border-white">{avatar(patient, 'h-9 w-9')}</span>)}{props.patients.length > 5 && <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-primary/10 text-xs font-bold text-primary">+{props.patients.length - 5}</span>}</div>
      </NavigationCard>
      <NavigationCard icon={CalendarDays} title="Sesiones y agenda" text={todayCount ? `${todayCount} ${todayCount === 1 ? 'sesión' : 'sesiones'} hoy` : 'Sin sesiones para hoy'} onClick={() => props.onNavigate('calendar')}>
        {upcoming[0] ? <SessionPreview session={upcoming[0]} patient={byPerteneciente.get(Number(upcoming[0].id_perteneciente))} /> : <SmallEmpty text="Todavía no hay próximas sesiones." />}
      </NavigationCard>
      <div className="max-md:hidden md:contents"><NavigationCard icon={FolderOpen} title="Documentos y notas" text="Archivos y seguimiento, juntos" onClick={() => props.onNavigate('documents')}>
        {notes[0] ? <div className="flex items-center gap-2 rounded-2xl bg-primary/[.045] p-3">{avatar(notes[0].patient)}<span className="min-w-0"><span className="block truncate text-sm font-semibold">{notes[0].title || 'Última nota compartida'}</span><span className="block truncate text-xs text-muted-foreground">{notes[0].patient.name}</span></span></div> : <SmallEmpty text="Sin notas recientes." />}
      </NavigationCard></div>
    </section>

    <div className="grid gap-3 md:gap-5 xl:grid-cols-2">
      <div className="max-md:hidden md:contents"><Card title="Resumen de pacientes" icon={Users} action="Ver pacientes" onAction={() => props.onNavigate('patients')}>
        <div className="space-y-4">{props.patients.slice(0, 6).map(patient => { const activities = props.activitiesByUser[patient.id] || []; const done = activities.filter(item => item.status === 'completada').length; const percent = activities.length ? Math.round(done / activities.length * 100) : 0; return <div key={patient.id} className="grid grid-cols-[minmax(90px,auto)_1fr_38px] items-center gap-3"><span className="flex min-w-0 items-center gap-2">{avatar(patient)}<span className="truncate text-xs font-semibold">{patient.name.split(' ')[0]}</span></span><span className="h-3 overflow-hidden rounded-full bg-primary/10"><span className="block h-full rounded-full bg-gradient-to-r from-primary to-violet-400" style={{ width: `${percent}%` }} /></span><span className="text-right text-xs font-bold tabular-nums">{activities.length ? `${percent}%` : '—'}</span></div>; })}{!props.patients.length && <SmallEmpty text="Todavía no hay pacientes vinculados." />}</div>
        <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-primary/[.035] p-3"><Metric value={props.patients.length} label="pacientes" /><Metric value={upcoming.length} label="próximas" /><Metric value={adherence === null ? '—' : `${adherence}%`} label="adherencia" /></div>
      </Card></div>
      <Card title="Próximas sesiones" icon={CalendarDays} action="Ver calendario" onAction={() => props.onNavigate('calendar')}>
        <div className="divide-y divide-border">{upcoming.slice(0, 5).map(session => <button key={session.id} type="button" onClick={() => props.onNavigate('calendar')} className="grid min-h-16 w-full grid-cols-[58px_1fr_auto] items-center gap-3 py-2 text-left hover:bg-primary/[.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="text-xs font-bold text-primary">{new Date(session.fecha_sesion).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{session.titulo}</span><span className="block text-xs text-muted-foreground">{session.duracion_minutos} min · {session.estado}</span></span><Person patient={byPerteneciente.get(Number(session.id_perteneciente))} /></button>)}{!upcoming.length && <SmallEmpty text="Todavía no hay sesiones programadas." />}</div>
      </Card>
    </div>
  </div>;
}

export function ProfessionalRecentActivity({ patients, emotionsByUser, notesByUser, onOpenPatient, embedded = false }: Pick<ProfessionalHomeProps, 'patients' | 'emotionsByUser' | 'notesByUser' | 'onOpenPatient'> & { embedded?: boolean }) {
  const emotions = Object.entries(emotionsByUser).flatMap(([userId, rows]) => rows.map(row => ({ ...row, patient: patients.find(item => item.id === userId)! }))).filter(item => item.patient);
  const notes = Object.entries(notesByUser).flatMap(([userId, rows]) => rows.map(row => ({ ...row, patient: patients.find(item => item.id === userId)! }))).filter(item => item.patient);
  const recent = [...emotions.slice(0, 8).map(item => ({ id: `emotion-${item.id}`, title: `Registró ${item.emotion.toLowerCase()}`, detail: 'Registro emocional', date: `${item.date}T${item.timestamp || '12:00'}`, patient: item.patient, icon: Heart, tone: 'bg-primary/10 text-primary' })), ...notes.slice(0, 8).map(item => ({ id: `note-${item.id}`, title: item.title || 'Actualizó una nota personal', detail: 'Nota compartida', date: item.createdAt, patient: item.patient, icon: FileText, tone: 'bg-primary/10 text-primary' }))].sort((a, b) => parseTime(b.date) - parseTime(a.date));
  return <div className="space-y-5">{!embedded && <PageHeading title="Actividad reciente" subtitle="Últimos registros y notas compartidas por tus pacientes." />}<Card title="Actividad reciente" icon={Activity}><div className="divide-y divide-border">{recent.map(item => <button key={item.id} type="button" onClick={() => onOpenPatient(item.patient.id)} aria-label={`${item.title}. Abrir perfil de ${item.patient.name}`} className="flex min-h-16 w-full items-center gap-3 py-3 text-left hover:bg-primary/[.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${item.tone}`}><item.icon size={19} aria-hidden /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{item.title}</span><span className="block truncate text-xs text-muted-foreground">{item.detail}</span></span><Person patient={item.patient} /><span className="hidden text-xs text-muted-foreground sm:block">{relative(item.date)}</span></button>)}{!recent.length && <SmallEmpty text="Sin actividad reciente disponible." />}</div></Card></div>;
}

export function ProfessionalEmotionalStatus({ patients, emotionsByUser, embedded = false }: Pick<ProfessionalHomeProps, 'patients' | 'emotionsByUser'> & { embedded?: boolean }) {
  const emotions = Object.entries(emotionsByUser).flatMap(([userId, rows]) => rows.map(row => ({ ...row, patient: patients.find(item => item.id === userId)! }))).filter(item => item.patient).sort((a, b) => `${b.date}T${b.timestamp}`.localeCompare(`${a.date}T${a.timestamp}`));
  return <div className="space-y-5">{!embedded && <PageHeading title="Estado emocional" subtitle="Registros emocionales recientes compartidos por tus pacientes." />}<Card title="Estado emocional reciente" icon={Heart}>{emotions.length ? <><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{emotions.map(item => <div key={`${item.patient.id}-${item.id}`} className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-primary/[.035] p-3"><span className="text-2xl" role="img" aria-label={item.emotion}>{item.emoji || '🙂'}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{item.emotion}</span><span className="block truncate text-xs text-muted-foreground">{item.patient.name} · {item.intensity}/5</span></span></div>)}</div><p className="mt-4 text-xs text-muted-foreground">Resumen descriptivo de registros compartidos; no representa una evaluación clínica.</p></> : <SmallEmpty text="No hay registros emocionales disponibles." />}</Card></div>;
}

function PageHeading({ title, subtitle }: { title: string; subtitle: string }) { return <header><h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1><p className="mt-2 text-sm text-muted-foreground sm:text-base">{subtitle}</p></header>; }

function NavigationCard({ icon: Icon, title, text, onClick, children }: { icon: typeof Users; title: string; text: string; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className="group min-h-0 rounded-[20px] border border-[#ece3f8] bg-white p-3.5 text-left shadow-[0_8px_24px_#f0e8f8] transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-48 md:rounded-[24px] md:p-5"><span className="flex items-start gap-2.5 md:gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary md:h-11 md:w-11 md:rounded-2xl"><Icon size={19} className="md:h-[22px] md:w-[22px]" aria-hidden /></span><span className="min-w-0 flex-1"><span className="block text-base font-bold text-[#2e2344] md:text-lg">{title}</span><span className="mt-0.5 block text-xs text-muted-foreground md:mt-1 md:text-sm">{text}</span></span><ChevronRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-0.5 md:h-6 md:w-6" aria-hidden /></span><span className="mt-3 block md:mt-5">{children}</span></button>; }
function Card({ title, icon: Icon, action, onAction, children }: { title: string; icon: typeof Users; action?: string; onAction?: () => void; children: React.ReactNode }) { return <section className="rounded-[20px] border border-[#ece3f8] bg-white p-3.5 shadow-[0_8px_24px_#f0e8f8] sm:p-5 md:rounded-[24px]"><header className="mb-2.5 flex items-center gap-2.5 md:mb-4 md:gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary md:h-10 md:w-10 md:rounded-2xl"><Icon size={18} className="md:h-5 md:w-5" aria-hidden /></span><h2 className="min-w-0 flex-1 text-base font-bold text-[#2e2344] md:text-lg">{title}</h2>{action && <button type="button" onClick={onAction} className="min-h-10 rounded-xl px-2 text-xs font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-11 md:text-sm">{action}</button>}</header>{children}</section>; }
function SessionPreview({ session, patient }: { session: ProfessionalSession; patient?: User }) { return <div className="flex items-center gap-3 rounded-2xl bg-primary/[.045] p-3">{avatar(patient, 'h-10 w-10')}<span className="min-w-0"><span className="block truncate text-sm font-semibold">{new Date(session.fecha_sesion).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} · {patient?.name || 'Paciente'}</span><span className="block truncate text-xs text-muted-foreground">{session.titulo} · {session.duracion_minutos} min</span></span></div>; }
function Person({ patient }: { patient?: User }) { return patient ? <span className="inline-flex max-w-28 items-center gap-1.5 rounded-full bg-primary/[.065] py-1 pl-1 pr-2 text-xs font-semibold text-primary">{avatar(patient, 'h-6 w-6')}<span className="truncate">{patient.name.split(' ')[0]}</span></span> : <span className="text-xs text-muted-foreground">Paciente</span>; }
function Metric({ value, label }: { value: string | number; label: string }) { return <div className="text-center"><strong className="block text-xl text-primary tabular-nums">{value}</strong><span className="text-[11px] text-muted-foreground">{label}</span></div>; }
function SmallEmpty({ text }: { text: string }) { return <p className="rounded-2xl border border-dashed border-border p-3 text-sm text-muted-foreground">{text}</p>; }
