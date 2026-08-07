import {
  Activity, CalendarDays, CheckCircle2, ChevronRight, Clock,
  FileText, Heart, MapPin, MessageCircle, ShieldCheck, Sparkles,
} from 'lucide-react';
import type { TutorHomeData, TutorHomeLinkedUser } from '@/data/api';

type DetailData = TutorHomeData['byUserId'][string];
type Destination = 'activities' | 'calendar' | 'chat' | 'reports';

interface Props {
  owner: TutorHomeLinkedUser;
  data?: DetailData;
  onNavigate: (destination: Destination) => void;
  onOpenChat: (userId: string) => void;
}

const emotionFallbacks: Record<string, string> = {
  ansioso: '😰', ansiedad: '😰', contento: '😊', feliz: '😄', orgulloso: '🥹',
  tranquilo: '😌', motivado: '💪', nervioso: '😬', preocupado: '😟',
  sorprendido: '😲', triste: '😢', frustrado: '😤', cansado: '😴',
  enojado: '😠', miedo: '😨', confundido: '😕',
};

function emotionEmoji(emotion: DetailData['emotions'][number]) {
  if (emotion.emoji?.trim()) return emotion.emoji;
  const normalized = emotion.emotion.trim().toLocaleLowerCase('es');
  return emotionFallbacks[normalized] || '🙂';
}

function avatar(owner: TutorHomeLinkedUser) {
  const value = owner.avatar?.trim();
  const isImage = value && (/^(https?:|data:image\/|\/)/.test(value) || /\.(png|jpe?g|webp|svg)$/i.test(value));
  return <span className="inline-flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-3xl font-bold text-primary" aria-hidden>{isImage ? <img src={value} alt="" className="h-full w-full object-cover" /> : value || owner.name.slice(0, 1)}</span>;
}

function formatDate(date: string, time?: string) {
  const parsed = new Date(`${date}T${time || '12:00'}`);
  if (Number.isNaN(parsed.getTime())) return [date, time].filter(Boolean).join(' · ');
  return parsed.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) + (time ? ` · ${time}` : '');
}

export default function TutorLinkedDetail({ owner, data, onNavigate, onOpenChat }: Props) {
  const activities = data?.activities || [];
  const emotions = data?.emotions || [];
  const events = data?.events || [];
  const locations = data?.locations || [];
  const completed = activities.filter(item => item.completed).length;
  const upcoming = events
    .filter(event => new Date(`${event.date}T${event.time || '00:00'}`).getTime() >= Date.now() - 3_600_000)
    .slice(0, 5);

  return <div className="space-y-5">
    <section className="overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,.98),rgba(243,237,253,.92))] p-5 shadow-[0_14px_40px_rgba(70,45,96,.09)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">{avatar(owner)}<div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wider text-primary">Detalle de perteneciente</p><h1 className="mt-1 text-3xl font-bold">{owner.name}</h1><div className="mt-2 flex flex-wrap gap-2"><InfoChip icon={ShieldCheck} text={`Apoyo: ${owner.supportLevel}`} /><InfoChip icon={Sparkles} text={`Autonomía: ${owner.autonomy}`} /><InfoChip icon={CheckCircle2} text={owner.linkStatus} /></div></div></div>
      {owner.observation && <p className="mt-5 rounded-2xl border border-primary/10 bg-white/70 p-4 text-sm text-muted-foreground"><span className="mb-1 block font-semibold text-foreground">Observación del vínculo</span>{owner.observation}</p>}
    </section>

    <section aria-label="Accesos para esta persona" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <DetailAction icon={MessageCircle} label="Abrir chat" onClick={() => onOpenChat(owner.id)} />
      <DetailAction icon={CalendarDays} label="Ver calendario" onClick={() => onNavigate('calendar')} />
      <DetailAction icon={Activity} label="Ver actividades" onClick={() => onNavigate('activities')} />
      <DetailAction icon={FileText} label="Ver reportes" onClick={() => onNavigate('reports')} />
    </section>

    <div className="grid grid-cols-3 gap-3">
      <Metric value={`${completed}/${activities.length}`} label="completadas" icon={CheckCircle2} />
      <Metric value={emotions.length} label="emociones" icon={Heart} />
      <Metric value={events.length} label="eventos" icon={CalendarDays} />
    </div>

    <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
      <Card title="Emociones recientes" icon={Heart}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          {emotions.slice(0, 6).map(emotion => <article key={emotion.id} className="flex gap-3 rounded-2xl border border-rose-100 bg-rose-50/45 p-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm" role="img" aria-label={emotion.emotion}>{emotionEmoji(emotion)}</span>
            <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="font-semibold">{emotion.emotion}</p><span className="shrink-0 text-xs font-semibold text-rose-700">{emotion.intensity}/5</span></div><Intensity value={emotion.intensity} /><p className="mt-1 text-xs text-muted-foreground">{formatDate(emotion.date, emotion.timestamp)}</p>{emotion.context && <p className="mt-2 text-sm">{emotion.context}</p>}{emotion.whatHelped && <p className="mt-1 text-xs text-emerald-700"><span className="font-semibold">Le ayudó:</span> {emotion.whatHelped}</p>}</div>
          </article>)}
          {!emotions.length && <Empty text="Todavía no hay emociones registradas." />}
        </div>
      </Card>

      <div className="space-y-5">
        <Card title="Próximos eventos" icon={CalendarDays} action="Ver calendario" onAction={() => onNavigate('calendar')}>
          <div className="space-y-2">{upcoming.map(event => <button key={event.id} type="button" onClick={() => onNavigate('calendar')} className="flex min-h-16 w-full items-center gap-3 rounded-2xl p-2 text-left hover:bg-primary/[.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><CalendarDays size={20} aria-hidden /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{event.title}</span><span className="block truncate text-xs text-muted-foreground">{formatDate(event.date, event.time)}{event.type ? ` · ${event.type}` : ''}</span></span><ChevronRight size={17} className="text-muted-foreground" aria-hidden /></button>)}{!upcoming.length && <Empty text="No hay eventos próximos." />}</div>
        </Card>
        <Card title="Lugares registrados" icon={MapPin}>
          <div className="space-y-2">{locations.slice(0, 4).map(location => <div key={location.id} className="flex items-center gap-3 rounded-2xl bg-emerald-50/55 p-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600"><MapPin size={19} aria-hidden /></span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{location.name}</span><span className="block truncate text-xs text-muted-foreground">{location.address || (location.type === 'seguro' ? 'Lugar seguro' : 'Ubicación actual')}</span></span></div>)}{!locations.length && <Empty text="No hay lugares registrados para mostrar." />}</div>
        </Card>
      </div>
    </div>

    <Card title="Últimas actividades" icon={Activity} action="Ver actividades" onAction={() => onNavigate('activities')}>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{activities.slice(0, 6).map(item => <div key={item.id} className="flex min-h-20 items-center gap-3 rounded-2xl border border-border/70 bg-muted/20 p-3"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.completed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{item.completed ? <CheckCircle2 size={21} aria-hidden /> : <Clock size={21} aria-hidden />}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{item.title}</span><span className="block text-xs text-muted-foreground">{item.status}</span></span></div>)}{!activities.length && <Empty text="Todavía no hay actividades." />}</div>
    </Card>
  </div>;
}

function Card({ title, icon: Icon, action, onAction, children }: { title: string; icon: typeof Heart; action?: string; onAction?: () => void; children: React.ReactNode }) {
  return <section className="rounded-[26px] border border-white/80 bg-white/90 p-4 shadow-[0_12px_36px_rgba(70,45,96,.075)] sm:p-5"><header className="mb-4 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon size={20} aria-hidden /></span><h2 className="min-w-0 flex-1 text-lg font-bold">{title}</h2>{action && <button type="button" onClick={onAction} className="min-h-11 rounded-xl px-2 text-sm font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{action}</button>}</header>{children}</section>;
}

function DetailAction({ icon: Icon, label, onClick }: { icon: typeof Heart; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex min-h-20 items-center gap-3 rounded-2xl border border-white bg-white/90 p-3 text-left text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={20} aria-hidden /></span>{label}</button>;
}

function InfoChip({ icon: Icon, text }: { icon: typeof Heart; text: string }) { return <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-white/75 px-3 py-1.5 text-xs font-semibold text-muted-foreground"><Icon size={14} className="text-primary" aria-hidden />{text}</span>; }
function Metric({ value, label, icon: Icon }: { value: string | number; label: string; icon: typeof Heart }) { return <div className="rounded-2xl border border-border/70 bg-white/85 p-3 text-center shadow-sm"><Icon size={18} className="mx-auto mb-1 text-primary" aria-hidden /><strong className="block text-xl text-primary sm:text-2xl">{value}</strong><span className="text-[11px] text-muted-foreground sm:text-xs">{label}</span></div>; }
function Intensity({ value }: { value: number }) { return <span className="mt-1 flex gap-1" aria-label={`Intensidad ${value} de 5`}>{[1, 2, 3, 4, 5].map(level => <span key={level} className={`h-1.5 flex-1 rounded-full ${level <= value ? 'bg-rose-400' : 'bg-rose-100'}`} />)}</span>; }
function Empty({ text }: { text: string }) { return <p className="rounded-2xl bg-muted/35 p-4 text-sm text-muted-foreground">{text}</p>; }
