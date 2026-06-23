import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Activity, Award, BarChart3, Calendar, CheckCircle2, Clock,
  Flame, Heart, Shield, Sparkles, Target, TrendingUp, Zap,
} from 'lucide-react';
import type { TutorHomeLinkedUser, TutorHomeData } from '@/data/api';

const STATUS_COLORS: Record<string, string> = {
  completada: '#22c55e',
  'en progreso': '#f59e0b',
  pendiente: '#6b7280',
  Completada: '#22c55e',
  'En progreso': '#f59e0b',
  Pendiente: '#6b7280',
};

const EMOJI_COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];

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

export default function TutorAdvancedStats({ activities, emotions, events, adherence, mainUser }: Props) {
  const completed = activities.filter(a => a.completed);
  const pending = activities.filter(a => !a.completed);
  const inProgress = activities.filter(a => a.status === 'en progreso');
  const totalPoints = activities.reduce((sum, a) => sum + (a.completed ? a.points : 0), 0);

  const today = new Date();

  // 14-day adherence data
  const dailyData = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (13 - i));
      const dayStr = fmtDate(d);
      const dayActs = activities.filter(a => a.assignedAt?.startsWith(dayStr));
      const done = dayActs.filter(a => a.completed).length;
      const pct = dayActs.length ? Math.round((done / dayActs.length) * 100) : 0;
      return {
        day: d.toLocaleDateString('es', { weekday: 'short' }).slice(0, 3).toUpperCase(),
        fullDate: dayStr,
        pct,
        completed: done,
        total: dayActs.length,
      };
    });
  }, [activities]);

  // Activity status distribution for pie
  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    activities.forEach(a => {
      const key = a.status.charAt(0).toUpperCase() + a.status.slice(1);
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [activities]);

  // Emotion distribution
  const emotionData = useMemo(() => {
    const map: Record<string, number> = {};
    emotions.forEach(e => {
      map[e.emotion] = (map[e.emotion] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [emotions]);

  // Emotion intensity trend (last 10)
  const emotionTrend = useMemo(() => {
    return emotions
      .slice(-10)
      .map(e => ({
        date: e.date?.slice(5) || '',
        intensity: e.intensity,
        emoji: e.emoji || '',
      }));
  }, [emotions]);

  // Category performance
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

  // Weekly comparison
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

  // Activity efficiency (time to complete)
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

  // Best day info
  const bestDay = useMemo(() => {
    const best = dailyData.reduce((max, d) => d.pct > max.pct ? d : max, dailyData[0] || { pct: 0, day: '' });
    return best;
  }, [dailyData]);

  const COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={<TrendingUp size={20} />} label="Adherencia" value={`${adherence}%`} sub={`${completed.length}/${activities.length} actividades`} />
        <KpiCard icon={<Flame size={20} />} label="Racha actual" value={`${mainUser.streak} días`} sub={weekData.thisWeek >= weekData.lastWeek ? 'Subiendo' : 'Bajando'} />
        <KpiCard icon={<Zap size={20} />} label="Puntos totales" value={`${totalPoints}`} sub={`Nivel ${mainUser.level}`} />
        <KpiCard icon={<Heart size={20} />} label="Intensidad emocional" value={emotions.length ? `${(emotions.reduce((s, e) => s + e.intensity, 0) / emotions.length).toFixed(1)}` : '-'} sub="/5 promedio" />
      </div>

      {/* Weekly Comparison Bar */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" /> Comparativa semanal
        </h3>
        <div className="flex items-end gap-4">
          <div className="flex-1 text-center">
            <p className="text-xs text-muted-foreground">Semana pasada</p>
            <p className="text-3xl font-bold text-muted-foreground">{weekData.lastWeek}%</p>
          </div>
          <div className="flex items-center text-2xl text-muted-foreground">
            {weekData.thisWeek > weekData.lastWeek ? '↑' : weekData.thisWeek < weekData.lastWeek ? '↓' : '→'}
          </div>
          <div className="flex-1 text-center">
            <p className="text-xs text-muted-foreground">Esta semana</p>
            <p className="text-3xl font-bold text-foreground">{weekData.thisWeek}%</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 bg-muted rounded-full h-2">
            <motion.div initial={{ width: 0 }} animate={{ width: `${weekData.lastWeek}%` }} className="h-2 rounded-full bg-muted-foreground/50" />
          </div>
          <div className="flex-1 bg-muted rounded-full h-2">
            <motion.div initial={{ width: 0 }} animate={{ width: `${weekData.thisWeek}%` }} className="h-2 rounded-full gradient-primary" />
          </div>
        </div>
      </div>

      {/* 14-day Adherence Chart */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
          <BarChart3 size={16} className="text-primary" /> Adherencia últimos 14 días
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dailyData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e5e7eb' }}
              formatter={(value: number, name: string) => [`${value}%`, name === 'pct' ? 'Adherencia' : name]}
              labelFormatter={(label: string) => `Día: ${label}`}
            />
            <Bar dataKey="pct" fill="#7C3AED" radius={[4, 4, 0, 0]} name="pct" />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Promedio 14d: <strong className="text-foreground">{Math.round(dailyData.reduce((s, d) => s + d.pct, 0) / Math.max(dailyData.length, 1))}%</strong></span>
          <span>Mejor día: <strong className="text-foreground">{bestDay.day} ({bestDay.pct}%)</strong></span>
        </div>
      </div>

      {/* Two-column charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Activity Status Pie */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Activity size={16} className="text-primary" /> Estado de actividades
          </h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, idx) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sin actividades</p>
          )}
        </div>

        {/* Emotion Distribution Pie */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Heart size={16} className="text-primary" /> Distribución emocional
          </h3>
          {emotionData.length > 0 ? (
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
                  {emotionData.map((_, idx) => (
                    <Cell key={idx} fill={EMOJI_COLORS[idx % EMOJI_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sin registros emocionales</p>
          )}
        </div>
      </div>

      {/* Category Performance */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
          <Award size={16} className="text-primary" /> Rendimiento por categoría
        </h3>
        {categoryData.length > 0 ? (
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
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Sin datos de categorías</p>
        )}
      </div>

      {/* Emotion Intensity Trend */}
      {emotionTrend.length > 1 && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" /> Tendencia de intensidad emocional
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={emotionTrend} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="intensity" stroke="#7C3AED" strokeWidth={2} dot={{ r: 3 }} name="Intensidad" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Activity efficiency + next level */}
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
            <span>Experiencia: <strong className="text-foreground">{mainUser.streak} días de racha</strong></span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar size={12} className="text-primary" />
            <span>Eventos próximos: <strong className="text-foreground">{events.filter(e => new Date(e.date) >= today).length}</strong></span>
          </div>
        </div>
      </div>

      {/* Support profile summary */}
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

function KpiCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
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
