import { useMemo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, ComposedChart, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Activity, Award, Calendar, CheckCircle2, Clock,
  Flame, Heart, Shield, Sparkles, TrendingUp, Zap,
} from 'lucide-react';
import type { TutorHomeLinkedUser, TutorHomeData } from '@/data/api';

const STATUS_COLORS: Record<string, string> = {
  Completadas: '#22c55e',
  'En progreso': '#f59e0b',
  Pendientes: '#6b7280',
};

const EMOJI_COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];
const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface Props {
  activities: TutorHomeData['byUserId'][string]['activities'];
  emotions: TutorHomeData['byUserId'][string]['emotions'];
  events: TutorHomeData['byUserId'][string]['events'];
  adherence: number;
  mainUser: TutorHomeLinkedUser;
}

function clampPct(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function fmtDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function isInProgress(status?: string) {
  return String(status || '').toLowerCase() === 'en progreso';
}

export default function TutorAdvancedStats({ activities, emotions, events, adherence, mainUser }: Props) {
  const completed = activities.filter(a => a.completed);
  const inProgress = activities.filter(a => !a.completed && isInProgress(a.status));
  const pending = activities.filter(a => !a.completed && !isInProgress(a.status));
  const today = new Date();

  const dailyActivityData = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (13 - i));
      const dayStr = fmtDate(d);
      const dayActs = activities.filter(a => a.assignedAt?.startsWith(dayStr));
      const done = dayActs.filter(a => a.completed).length;
      const progress = dayActs.filter(a => !a.completed && isInProgress(a.status)).length;
      const wait = dayActs.filter(a => !a.completed && !isInProgress(a.status)).length;
      const total = dayActs.length;

      return {
        day: diasSemana[d.getDay()],
        fullDate: dayStr,
        Completadas: done,
        'En progreso': progress,
        Pendientes: wait,
        pct: total ? Math.round((done / total) * 100) : 0,
        total,
      };
    });
  }, [activities]);

  const emotionData = useMemo(() => {
    const map: Record<string, { count: number; totalIntensity: number }> = {};
    emotions.forEach(e => {
      if (!map[e.emotion]) map[e.emotion] = { count: 0, totalIntensity: 0 };
      map[e.emotion].count++;
      map[e.emotion].totalIntensity += e.intensity;
    });

    return Object.entries(map)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6)
      .map(([name, data]) => ({
        name,
        value: data.count,
        avgIntensity: (data.totalIntensity / Math.max(data.count, 1)).toFixed(1),
      }));
  }, [emotions]);

  const emotionTrend = useMemo(() => {
    return emotions
      .slice(-10)
      .map(e => ({
        date: e.date?.slice(5) || '',
        intensity: e.intensity,
        emoji: e.emoji || '',
        emotion: e.emotion,
      }));
  }, [emotions]);

  const categoryData = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    activities.forEach(a => {
      const cat = a.category || 'General';
      if (!map[cat]) map[cat] = { total: 0, done: 0 };
      map[cat].total++;
      if (a.completed) map[cat].done++;
    });
    return Object.entries(map)
      .map(([name, v]) => ({
        name,
        Completadas: v.done,
        Pendientes: v.total - v.done,
        tasa: v.total ? Math.round((v.done / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.tasa - a.tasa);
  }, [activities]);

  const difficultyData = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    activities.forEach(a => {
      const difficulty = a.difficulty || 'Media';
      if (!map[difficulty]) map[difficulty] = { total: 0, done: 0 };
      map[difficulty].total++;
      if (a.completed) map[difficulty].done++;
    });
    return Object.entries(map).map(([name, data]) => ({
      name,
      done: data.done,
      total: data.total,
      pct: data.total ? clampPct((data.done / data.total) * 100) : 0,
    }));
  }, [activities]);

  const weekData = useMemo(() => {
    const thisWeek = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return fmtDate(d);
    });
    const lastWeek = thisWeek.map(d => {
      const dt = new Date(d);
      dt.setDate(dt.getDate() - 7);
      return fmtDate(dt);
    });

    const calc = (days: string[]) => {
      const acts = activities.filter(a => days.includes(a.assignedAt?.slice(0, 10)));
      const done = acts.filter(a => a.completed).length;
      return acts.length ? Math.round((done / acts.length) * 100) : 0;
    };

    return {
      thisWeek: calc(thisWeek),
      lastWeek: calc(lastWeek),
    };
  }, [activities]);

  const efficiency = useMemo(() => {
    const withTime = activities.filter(a => a.completed && a.assignedAt && a.completedAt);
    if (!withTime.length) return null;
    const totalHours = withTime.reduce((sum, a) => {
      const start = new Date(a.assignedAt).getTime();
      const end = new Date(a.completedAt!).getTime();
      return sum + Math.max(0, (end - start) / (1000 * 60 * 60));
    }, 0);
    return Math.round(totalHours / withTime.length);
  }, [activities]);

  const average14d = clampPct(
    dailyActivityData.reduce((sum, d) => sum + d.pct, 0) / Math.max(dailyActivityData.length, 1)
  );

  const bestDay = useMemo(() => {
    return dailyActivityData.reduce(
      (max, d) => d.pct > max.pct ? d : max,
      dailyActivityData[0] || { pct: 0, day: '', total: 0 }
    );
  }, [dailyActivityData]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={<TrendingUp size={20} />} label="Adherencia" value={`${adherence}%`} sub={`${completed.length}/${activities.length} actividades`} />
        <KpiCard icon={<Flame size={20} />} label="Racha actual" value={`${mainUser.streak} dias`} sub={weekData.thisWeek >= weekData.lastWeek ? 'Subiendo' : 'Bajando'} />
        <KpiCard icon={<Zap size={20} />} label="Puntos totales" value={`${mainUser.points}`} sub={`Nivel ${mainUser.level}`} />
        <KpiCard icon={<Heart size={20} />} label="Intensidad emocional" value={emotions.length ? `${(emotions.reduce((s, e) => s + e.intensity, 0) / emotions.length).toFixed(1)}` : '-'} sub="/5 promedio" />
      </div>

      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
          <Activity size={16} className="text-primary" /> Actividades y Adherencia
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <MiniKpi label="Completadas" value={completed.length} className="text-green-600 bg-green-50 border-green-100" />
          <MiniKpi label="En progreso" value={inProgress.length} className="text-amber-600 bg-amber-50 border-amber-100" />
          <MiniKpi label="Pendientes" value={pending.length} className="text-gray-600 bg-gray-50 border-gray-100" />
          <MiniKpi label="Adherencia" value={`${adherence}%`} className="text-primary bg-primary/5 border-primary/15" />
        </div>

        <div translate="no" className="notranslate">
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={dailyActivityData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} allowDecimals={false} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e5e7eb' }}
              formatter={(value: number, name: string) => [
                name === 'pct' ? `${value}%` : value,
                name === 'pct' ? 'Adherencia' : name,
              ]}
              labelFormatter={(label: string) => `Dia: ${label}`}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="left" dataKey="Completadas" stackId="actividades" fill={STATUS_COLORS.Completadas} radius={[3, 3, 0, 0]} />
            <Bar yAxisId="left" dataKey="En progreso" stackId="actividades" fill={STATUS_COLORS['En progreso']} radius={[3, 3, 0, 0]} />
            <Bar yAxisId="left" dataKey="Pendientes" stackId="actividades" fill={STATUS_COLORS.Pendientes} radius={[3, 3, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="pct" stroke="#7C3AED" strokeWidth={2} dot={{ r: 3 }} name="Adherencia" />
          </ComposedChart>
        </ResponsiveContainer>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground md:grid-cols-4">
          <InfoPill label="Semana pasada" value={`${weekData.lastWeek}%`} />
          <InfoPill label="Esta semana" value={`${weekData.thisWeek}%`} />
          <InfoPill label="Promedio 14d" value={`${average14d}%`} />
          <InfoPill label="Mejor dia" value={`${bestDay.day || '-'} (${bestDay.pct || 0}%)`} />
        </div>

        {difficultyData.length > 0 && (
          <div className="mt-4 rounded-lg border border-border bg-background p-3">
            <p className="mb-3 text-sm font-semibold text-foreground">Por dificultad</p>
            <div className="space-y-3">
              {difficultyData.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="w-24 truncate text-xs capitalize text-foreground">{item.name}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${item.pct}%` }} />
                  </div>
                  <span className="w-12 text-right text-xs font-bold text-foreground">{item.done}/{item.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {emotions.length > 0 && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Heart size={16} className="text-primary" /> Evolucion emocional
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Tendencia de intensidad</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={emotionTrend} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="intensity" stroke="#7C3AED" strokeWidth={2} dot={{ r: 3 }} name="Intensidad" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Distribucion de emociones</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={emotionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {emotionData.map((entry, idx) => (
                      <Cell key={entry.name} fill={EMOJI_COLORS[idx % EMOJI_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<EmotionTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {categoryData.length > 0 && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Award size={16} className="text-primary" /> Rendimiento por categoria
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Completadas" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pendientes" fill="#6b7280" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock size={16} className="text-primary" /> Eficiencia
          </h3>
          <div className="text-center py-4">
            <p className="text-4xl font-bold text-foreground">
              {efficiency !== null ? `${efficiency}h` : '-'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Tiempo promedio en completar actividades</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-3 mt-2">
            <CheckCircle2 size={12} className="text-success" />
            {activities.filter(a => a.completed && a.assignedAt && !a.completedAt).length > 0
              ? `${activities.filter(a => a.completed && a.assignedAt && !a.completedAt).length} actividades sin fecha de completitud`
              : `${completed.length} actividades completadas`}
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-primary" /> Progreso y logros
          </h3>
          <div className="grid grid-cols-2 gap-3 text-center mb-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-2xl font-bold text-foreground">{mainUser.level}</p>
              <p className="text-[10px] text-muted-foreground">Nivel actual</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-2xl font-bold text-foreground">{mainUser.points}</p>
              <p className="text-[10px] text-muted-foreground">Puntos totales</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Award size={12} className="text-primary" />
            <span>Experiencia: <strong className="text-foreground">{mainUser.streak} dias de racha</strong></span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar size={12} className="text-primary" />
            <span>Eventos proximos: <strong className="text-foreground">{events.filter(e => new Date(e.date) >= today).length}</strong></span>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
          <Shield size={16} className="text-primary" /> Perfil del perteneciente
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Nivel de apoyo</p>
            <p className="font-bold text-foreground">{mainUser.supportLevel}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Autonomía</p>
            <p className="font-bold text-foreground">{mainUser.autonomy}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Autogestión</p>
            <p className="font-bold text-foreground">{mainUser.canSelfManage ? 'Habilitada' : 'Asistida'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Estado del vínculo</p>
            <p className="font-bold text-foreground">{mainUser.linkStatus}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmotionTooltip({ active, payload }: { active?: boolean; payload?: { payload: { name: string; value: number; avgIntensity: string } }[] }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white rounded-lg border border-border shadow-md p-3 text-xs space-y-1">
      <p className="font-semibold text-foreground">{data.name}</p>
      <p className="text-muted-foreground">Cantidad: <strong>{data.value}</strong></p>
      <p className="text-muted-foreground">Intensidad promedio: <strong>{data.avgIntensity}/5</strong></p>
    </div>
  );
}

function KpiCard({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="bg-gradient-to-br from-card to-card/50 rounded-xl p-3 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-primary">{icon}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs font-medium text-foreground">{label}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function MiniKpi({ label, value, className }: { label: string; value: string | number; className: string }) {
  return (
    <div className={`rounded-lg border p-3 text-center ${className}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[10px] font-medium">{label}</p>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2 text-center">
      <p>{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}
