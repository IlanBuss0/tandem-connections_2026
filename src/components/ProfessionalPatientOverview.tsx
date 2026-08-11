import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, Heart, Info, ListChecks, MessageSquare, Sparkles } from 'lucide-react';
import type { EmotionalRecord, ProfessionalSession, User } from '@/data/api';
import { fetchUsageEvents, type UsageEventRecord } from '@/data/usageApi';

type Props = {
  user: User;
  emotions: EmotionalRecord[];
  sessions: ProfessionalSession[];
  supportLevel: string;
  autonomy: string;
};

const card = 'rounded-2xl border border-[#ebe7f2] bg-white shadow-[0_8px_24px_rgba(55,38,80,0.06)]';

function formatDate(value?: string) {
  if (!value) return 'Sin registrar';
  return new Date(value).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
}

export default function ProfessionalPatientOverview({ user, emotions, sessions, supportLevel, autonomy }: Props) {
  const [events, setEvents] = useState<UsageEventRecord[]>([]);

  useEffect(() => {
    fetchUsageEvents(user.id, { limit: 80 }).then(setEvents);
  }, [user.id]);

  const data = useMemo(() => {
    const orderedSessions = [...sessions].sort((a, b) => b.fecha_sesion.localeCompare(a.fecha_sesion));
    const last = orderedSessions.find((session) => session.estado === 'completada');
    const next = [...sessions]
      .filter((session) => session.estado === 'programada' && new Date(session.fecha_sesion).getTime() >= Date.now())
      .sort((a, b) => a.fecha_sesion.localeCompare(b.fecha_sesion))[0];
    const since = last ? new Date(last.fecha_sesion).getTime() : 0;
    const recentEvents = events.filter((event) => new Date(event.ocurrido_en).getTime() >= since);
    const recentEmotions = emotions.filter((emotion) => new Date(emotion.date).getTime() >= since);
    const steps = recentEvents.filter((event) => event.tipo_evento === 'rutina_paso_completado').length;
    const supportCards = recentEvents.filter((event) => event.tipo_evento === 'tarjeta_autonomia_usada');
    const dayRequests = recentEvents.filter((event) => event.tipo_evento === 'pedido_dia');
    const intenseEmotions = recentEmotions.filter((emotion) => emotion.intensity >= 4);
    const topSupport = Object.entries(supportCards.reduce<Record<string, number>>((acc, event) => {
      const label = String(event.valor?.label || event.valor?.stepTitle || event.entidad_id || 'Apoyo');
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {})).sort((a, b) => b[1] - a[1])[0];

    const sentences = [];
    if (steps) sentences.push(`${user.name.split(' ')[0]} completó ${steps} pasos de rutina desde la última sesión.`);
    if (topSupport) sentences.push(`El apoyo más utilizado fue “${topSupport[0]}” (${topSupport[1]} ${topSupport[1] === 1 ? 'vez' : 'veces'}).`);
    if (recentEmotions.length) sentences.push(`Registró ${recentEmotions.length} ${recentEmotions.length === 1 ? 'emoción' : 'emociones'}; ${intenseEmotions.length} de intensidad alta.`);

    const timeline = [
      ...recentEvents.filter((event) => event.tipo_evento !== 'emocion_registrada').map((event) => ({ date: event.ocurrido_en, type: event.tipo_evento, value: event.valor })),
      ...recentEmotions.map((emotion) => ({ date: emotion.date, type: 'emocion_registrada' as const, value: { emotion: emotion.emotion, intensity: emotion.intensity } })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    return { last, next, steps, supportCards, dayRequests, recentEmotions, intenseEmotions, topSupport, sentences, timeline };
  }, [emotions, events, sessions, user.name]);

  const timelineLabel = (item: (typeof data.timeline)[number]) => {
    if (item.type === 'rutina_paso_completado') return `Completó un paso de “${String(item.value?.title || 'una rutina')}”.`;
    if (item.type === 'tarjeta_autonomia_usada') return `Usó “${String(item.value?.label || item.value?.stepTitle || 'una tarjeta de apoyo')}”.`;
    if (item.type === 'pedido_dia') return `Pidió agregar “${String(item.value?.text || 'una actividad')}” a su día.`;
    if (item.type === 'emocion_registrada') return `Registró “${String(item.value?.emotion || 'una emoción')}”, intensidad ${String(item.value?.intensity || '—')} de 5.`;
    if (item.type === 'enunciado_hablado') return 'Utilizó el comunicador.';
    return 'Registró una acción en Tándem.';
  };

  return (
    <div className="grid gap-4 md:max-lg:grid-cols-2 xl:grid-cols-[1.02fr_1.2fr]">
      <section className={`${card} p-5 max-sm:rounded-[22px] max-sm:p-4 sm:p-6`}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-50 text-[#6844d9]"><Sparkles size={20} /></span>
          <div><h3 className="text-lg font-bold text-[#302444]">Resumen reciente</h3><p className="text-xs text-[#81778d]">Generado a partir de datos registrados en Tándem</p></div>
        </div>
        <p className="mt-5 text-sm leading-7 text-[#51475f] max-sm:mt-4 max-sm:leading-6">
          {data.sentences.length ? data.sentences.join(' ') : 'Todavía no hay suficientes registros desde la última sesión para construir un resumen.'}
        </p>
        <div className="mt-6 flex items-center gap-2 border-t border-[#eeeaf4] pt-4 text-xs text-[#81778d]"><Info size={15} className="text-[#6844d9]" />Este resumen no reemplaza la evaluación profesional.</div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Nivel de apoyo', supportLevel, Sparkles, 'bg-violet-50 text-violet-600'],
          ['Autonomía', autonomy, MessageSquare, 'bg-amber-50 text-amber-600'],
          ['Última sesión', formatDate(data.last?.fecha_sesion), CheckCircle2, 'bg-emerald-50 text-emerald-600'],
          ['Próxima sesión', formatDate(data.next?.fecha_sesion), CalendarDays, 'bg-violet-50 text-violet-600'],
        ].map(([label, value, Icon, tone]) => (
          <div key={String(label)} className={`${card} flex min-h-36 flex-col items-center justify-center p-3 text-center max-sm:min-h-32 max-sm:rounded-[22px]`}>
            <span className={`mb-3 flex h-11 w-11 items-center justify-center rounded-full ${tone}`}><Icon size={20} /></span>
            <p className="text-xs text-[#776d83]">{label}</p><p className="mt-1 text-base font-bold text-[#302444]">{value}</p>
          </div>
        ))}
      </div>

      <section className={`${card} p-5 max-sm:rounded-[22px] max-sm:p-4`}>
        <h3 className="mb-4 font-bold text-[#302444]">Aspectos para revisar</h3>
        <div className="space-y-3">
          {data.topSupport && <Review icon={AlertTriangle} tone="amber" text={`El apoyo “${data.topSupport[0]}” fue utilizado ${data.topSupport[1]} veces.`} />}
          {data.intenseEmotions.length > 0 && <Review icon={Heart} tone="rose" text={`Se registraron ${data.intenseEmotions.length} emociones de intensidad alta.`} />}
          {!data.topSupport && !data.intenseEmotions.length && <p className="rounded-xl bg-[#f8f6fb] p-4 text-sm text-[#81778d]">No hay aspectos destacados con los datos disponibles.</p>}
        </div>
      </section>

      <section className={`${card} p-5 max-sm:rounded-[22px] max-sm:p-4`}>
        <h3 className="mb-4 font-bold text-[#302444]">Desde la última sesión</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:max-lg:grid-cols-2">
          <Metric icon={CheckCircle2} value={data.steps} label="pasos de rutina" tone="violet" />
          <Metric icon={Heart} value={data.recentEmotions.length} label="emociones" tone="rose" />
          <Metric icon={MessageSquare} value={data.supportCards.length} label="apoyos usados" tone="green" />
          <Metric icon={ListChecks} value={data.dayRequests.length} label="pedidos para el día" tone="amber" />
        </div>
        <div className="mt-5 divide-y divide-[#eeeaf4]">
          {data.timeline.map((item, index) => <div key={`${item.date}-${index}`} className="grid gap-1 py-3 text-sm sm:grid-cols-[110px_1fr] md:max-lg:grid-cols-1"><span className="text-xs text-[#81778d]">{new Date(item.date).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span><span className="text-[#51475f]">{timelineLabel(item)}</span></div>)}
          {!data.timeline.length && <p className="py-4 text-sm text-[#81778d]">Todavía no hay actividad reciente para mostrar.</p>}
        </div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, value, label, tone }: { icon: typeof Heart; value: number; label: string; tone: 'violet' | 'rose' | 'green' | 'amber' }) {
  const tones = { violet: 'bg-violet-50 text-violet-600', rose: 'bg-rose-50 text-rose-500', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600' };
  return <div className="flex items-center gap-2"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}><Icon size={18} /></span><div><p className="text-xl font-bold text-[#302444]">{value}</p><p className="text-[10px] leading-tight text-[#81778d]">{label}</p></div></div>;
}

function Review({ icon: Icon, tone, text }: { icon: typeof Heart; tone: 'amber' | 'rose'; text: string }) {
  const styles = tone === 'amber' ? 'border-amber-200 bg-amber-50/60 text-amber-700' : 'border-rose-200 bg-rose-50/60 text-rose-700';
  return <div className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${styles}`}><Icon size={18} className="shrink-0" /><span>{text}</span></div>;
}
