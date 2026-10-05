import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Heart, Info, MessageSquare, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Activity, EmotionalRecord, ProfessionalSession, User } from '@/data/api';
import { fetchAutonomyCardUsage, fetchEvolutionReport, type AutonomyCardUsage, type EvolutionWeek } from '@/data/usageApi';

interface Props { user: User; activities?: Activity[]; emotions?: EmotionalRecord[]; sessions?: ProfessionalSession[] }
const card = 'rounded-2xl border border-[#ebe7f2] bg-white p-4 shadow-[0_8px_24px_rgba(55,38,80,0.06)] sm:p-5';
const violet = '#7047DB';

export default function AdvancedStats({ user, emotions = [], sessions = [] }: Props) {
  const [weeks, setWeeks] = useState<EvolutionWeek[]>([]);
  const [supportUsage, setSupportUsage] = useState<AutonomyCardUsage[]>([]);
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');

  useEffect(() => {
    Promise.all([fetchEvolutionReport(user.id), fetchAutonomyCardUsage(user.id)]).then(([evolution, supports]) => {
      setWeeks(evolution);
      setSupportUsage(supports);
    });
  }, [user.id]);

  const data = useMemo(() => {
    const days = Number(period);
    const from = Date.now() - days * 86400000;
    const recentEmotions = emotions.filter((emotion) => new Date(emotion.date).getTime() >= from);
    const emotionByWeek = weeks.map((week, index) => ({
      name: `Sem ${index + 1}`,
      animoPositivo: week.positiveEmotionRatio === null ? null : Math.round(week.positiveEmotionRatio * 100),
      rutinas: week.routineCompletions,
    }));
    const status = sessions.reduce<Record<string, number>>((acc, session) => { acc[session.estado] = (acc[session.estado] || 0) + 1; return acc; }, {});
    const attended = status.completada || 0;
    const absent = status.ausente || 0;
    const attendance = attended + absent ? Math.round(attended / (attended + absent) * 100) : null;
    const communication = [
      { name: 'Registros emocionales', value: recentEmotions.length, color: '#F45D83' },
      { name: 'Apoyos utilizados', value: supportUsage.reduce((sum, item) => sum + item.count, 0), color: violet },
    ].filter((item) => item.value > 0);
    return { emotionByWeek, status, attended, absent, attendance, communication };
  }, [emotions, period, sessions, supportUsage, weeks]);

  return <div className="space-y-4">
    <div className="flex gap-2 overflow-x-auto pb-1 max-lg:grid max-lg:grid-cols-3 max-lg:overflow-visible">
      {([['7', '7 días'], ['30', '30 días'], ['90', '3 meses']] as const).map(([value, label]) => <button key={value} onClick={() => setPeriod(value)} className={`min-h-11 min-w-24 rounded-lg border px-4 text-sm font-semibold max-lg:min-w-0 max-lg:px-2 ${period === value ? 'border-[#7047DB] bg-violet-50 text-[#6237cf]' : 'border-[#e5dfed] bg-white text-[#756b82]'}`}>{label}</button>)}
    </div>

    <div className="grid gap-4 md:max-lg:grid-cols-2 xl:grid-cols-2">
      <ChartCard title="Evolución emocional" icon={Heart} source={`${emotions.length} registros emocionales`}>
        {data.emotionByWeek.some((item) => item.animoPositivo !== null) ? <ResponsiveContainer width="100%" height={230}><LineChart data={data.emotionByWeek} margin={{ left: -10, right: 12, top: 12 }}><CartesianGrid stroke="#eeeaf4" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} /><Tooltip formatter={(value) => [`${value}%`, 'Ánimo positivo']} /><Line type="monotone" dataKey="animoPositivo" stroke={violet} strokeWidth={3} dot={{ r: 5, fill: violet }} connectNulls /></LineChart></ResponsiveContainer> : <Empty text="Todavía no hay suficientes registros para mostrar la evolución emocional." />}
      </ChartCard>

      <ChartCard title="Rutinas" icon={TrendingUp} source={`${weeks.reduce((sum, week) => sum + week.routineCompletions, 0)} pasos registrados`}>
        {weeks.some((week) => week.routineCompletions > 0) ? <ResponsiveContainer width="100%" height={230}><BarChart data={data.emotionByWeek} margin={{ left: -20, right: 12, top: 12 }}><CartesianGrid stroke="#eeeaf4" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="rutinas" fill={violet} radius={[6, 6, 0, 0]} maxBarSize={46} /></BarChart></ResponsiveContainer> : <Empty text="Todavía no hay pasos de rutina registrados." />}
      </ChartCard>

      <ChartCard title="Apoyos más utilizados" icon={MessageSquare} source={`${supportUsage.reduce((sum, item) => sum + item.count, 0)} usos registrados`}>
        {supportUsage.length ? <div className="space-y-4 py-3">{supportUsage.slice(0, 5).map((item) => { const max = supportUsage[0]?.count || 1; return <div key={`${item.entidadTipo}-${item.entidadId}`}><div className="mb-1 flex justify-between gap-3 text-xs"><span className="truncate text-[#51475f]">{item.label}</span><b>{item.count}</b></div><div className="h-2 rounded-full bg-[#eeeaf4]"><div className="h-2 rounded-full bg-gradient-to-r from-[#8259e5] to-[#6738d2]" style={{ width: `${item.count / max * 100}%` }} /></div></div>})}</div> : <Empty text="Todavía no hay apoyos utilizados con frecuencia suficiente." />}
      </ChartCard>

      <ChartCard title="Registros disponibles" icon={BarChart3} source="Datos registrados en Tándem">
        {data.communication.length ? <div className="grid items-center gap-3 sm:grid-cols-2"><ResponsiveContainer width="100%" height={210}><PieChart><Pie data={data.communication} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={3}>{data.communication.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="space-y-3">{data.communication.map((item) => <div key={item.name} className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2 text-[#62586e]"><i className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />{item.name}</span><b>{item.value}</b></div>)}</div></div> : <Empty text="Todavía no hay registros suficientes." />}
      </ChartCard>

      <section className={`${card} xl:col-span-2`}>
        <h3 className="font-bold text-[#302444]">Asistencia a sesiones</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-4">
          <Stat value={data.attended} label="realizadas" tone="text-emerald-600 bg-emerald-50" />
          <Stat value={data.absent} label="ausentes" tone="text-rose-600 bg-rose-50" />
          <Stat value={data.status.cancelada || 0} label="canceladas" tone="text-amber-600 bg-amber-50" />
          <Stat value={data.attendance === null ? '—' : `${data.attendance}%`} label="de asistencia" tone="text-violet-600 bg-violet-50" />
        </div>
      </section>
    </div>

    <section className={`${card}`}><h3 className="mb-3 font-bold text-[#302444]">Lectura rápida</h3><div className="space-y-2 text-sm text-[#5d5269]"><p>• {supportUsage.length ? `El apoyo más utilizado es “${supportUsage[0].label}”.` : 'Todavía no hay un apoyo utilizado con suficiente frecuencia.'}</p><p>• {weeks.length > 1 ? `La última semana registra ${weeks.at(-1)?.routineCompletions || 0} pasos de rutina.` : 'Todavía no hay suficientes semanas para comparar rutinas.'}</p><p>• Las coincidencias observadas no implican una relación causal.</p></div></section>
  </div>;
}

function ChartCard({ title, icon: Icon, source, children }: { title: string; icon: typeof Heart; source: string; children: React.ReactNode }) { return <section className={`${card} max-sm:rounded-[22px] max-sm:p-4`}><div className="flex items-center gap-2"><Icon size={18} className="text-[#7047DB]" /><h3 className="font-bold text-[#302444]">{title}</h3><Info size={13} className="text-[#92899d]" /></div><div className="mt-3 max-sm:-mx-2">{children}</div><p className="mt-3 border-t border-[#eeeaf4] pt-3 text-[11px] text-[#8b8295]">Fuente: {source}</p></section> }
function Empty({ text }: { text: string }) { return <div className="flex h-[210px] items-center justify-center px-6 text-center text-sm text-[#81778d]">{text}</div> }
function Stat({ value, label, tone }: { value: number | string; label: string; tone: string }) { return <div className={`rounded-2xl p-4 text-center ${tone}`}><p className="text-2xl font-bold">{value}</p><p className="text-xs">{label}</p></div> }
