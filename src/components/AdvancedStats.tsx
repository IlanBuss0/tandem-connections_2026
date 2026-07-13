import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity as ActivityIcon, Heart, Target, Award, Calendar, Clock, Sparkles } from 'lucide-react';
import {
  Activity, fetchActivitiesForUser, getEmotionsForUser, getObjectivesForUser, calendarEvents,
  achievements as allAchievements, User,
} from '@/data/api';

interface Props {
  user: User;
  activities?: Activity[];
}

const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function AdvancedStats({ user, activities }: Props) {
  const [loadedActivities, setLoadedActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (activities) return;
    let mounted = true;
    fetchActivitiesForUser(user.id)
      .then(rows => {
        if (mounted) setLoadedActivities(rows);
      })
      .catch(() => {
        if (mounted) setLoadedActivities([]);
      });
    return () => { mounted = false; };
  }, [activities, user.id]);

  const stats = useMemo(() => {
    const acts = activities ?? loadedActivities;
    const completed = acts.filter(a => a.status === 'completada');
    const inProgress = acts.filter(a => a.status === 'en progreso');
    const pending = acts.filter(a => a.status === 'pendiente');
    const adherence = acts.length ? Math.round((completed.length / acts.length) * 100) : 0;

    // Por categoría
    const byCategory: Record<string, { total: number; done: number }> = {};
    acts.forEach(a => {
      byCategory[a.category] = byCategory[a.category] || { total: 0, done: 0 };
      byCategory[a.category].total++;
      if (a.status === 'completada') byCategory[a.category].done++;
    });

    // Por dificultad
    const byDifficulty = { fácil: 0, medio: 0, avanzado: 0 } as Record<string, number>;
    completed.forEach(a => { byDifficulty[a.difficulty] = (byDifficulty[a.difficulty] || 0) + 1; });

    // Emociones
    const emotions = getEmotionsForUser(user.id);
    const emotionAvg = emotions.length ? (emotions.reduce((s, e) => s + e.intensity, 0) / emotions.length).toFixed(1) : '0';
    const emotionMap: Record<string, number> = {};
    emotions.forEach(e => { emotionMap[e.emotion] = (emotionMap[e.emotion] || 0) + 1; });
    const topEmotions = Object.entries(emotionMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Adherencia por día (últimos 14)
    const today = new Date();
    const dailyAdherence: { day: string; pct: number; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const label = diasSemana[d.getDay()].slice(0, 1);
      // Mock determinístico basado en seed
      const seed = (d.getDate() + user.id.length) % 7;
      const pct = [85, 70, 95, 60, 90, 75, 50][seed];
      dailyAdherence.push({ day: label, pct, count: Math.round(pct / 20) });
    }

    // Objetivos
    const objs = getObjectivesForUser(user.id);
    const objsActive = objs.filter(o => o.status === 'activo');
    const objsCompleted = objs.filter(o => o.status === 'completado');
    const avgObjProgress = objsActive.length
      ? Math.round(objsActive.reduce((s, o) => s + (o.progress / o.target), 0) / objsActive.length * 100)
      : 0;

    // Calendario
    const events = calendarEvents.filter(e => e.userId === user.id);
    const upcomingEvents = events.filter(e => new Date(e.date) >= today).length;

    // Logros
    const userAchievements = allAchievements.filter(a => a.unlocked).slice(0, 8);

    // Tiempo activo estimado (mock)
    const minutesThisWeek = completed.length * 12 + 30;

    return {
      acts, completed, inProgress, pending, adherence,
      byCategory, byDifficulty,
      emotions, emotionAvg, topEmotions,
      dailyAdherence,
      objsActive, objsCompleted, avgObjProgress,
      upcomingEvents, userAchievements, minutesThisWeek,
    };
  }, [activities, loadedActivities, user]);

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon="✅" label="Adherencia" value={`${stats.adherence}%`} sub={`${stats.completed.length} de ${stats.acts.length}`} accent="success" />
        <KpiCard icon="🔥" label="Racha" value={`${user.streak}`} sub="días consecutivos" accent="warning" />
        <KpiCard icon="⏱️" label="Tiempo activo" value={`${stats.minutesThisWeek} min`} sub="esta semana" accent="primary" />
        <KpiCard icon="🏆" label="Logros" value={`${stats.userAchievements.length}`} sub={`Nivel ${user.level}`} accent="accent" />
      </div>

      {/* Heatmap adherencia 14 días */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" /> Adherencia últimos 14 días
        </h3>
        <div className="flex items-end gap-1 h-28">
          {stats.dailyAdherence.map((d, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${d.pct}%` }}
              transition={{ delay: i * 0.03 }}
              className="flex-1 flex flex-col items-center gap-1 justify-end"
            >
              <div className="w-full rounded-t-md gradient-primary" style={{ height: `${d.pct}%`, minHeight: 4 }} title={`${d.pct}%`} />
              <span translate="no" className="notranslate text-[9px] text-muted-foreground">{d.day}</span>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-between mt-3 text-xs text-muted-foreground">
          <span>Promedio: <strong className="text-foreground">{Math.round(stats.dailyAdherence.reduce((s, d) => s + d.pct, 0) / stats.dailyAdherence.length)}%</strong></span>
          <span>Mejor día: <strong className="text-foreground">{Math.max(...stats.dailyAdherence.map(d => d.pct))}%</strong></span>
        </div>
      </div>

      {/* 2 cols */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Por categoría */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <ActivityIcon size={16} className="text-primary" /> Por categoría
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.byCategory).slice(0, 6).map(([cat, v]) => {
              const pct = Math.round((v.done / v.total) * 100);
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground capitalize">{cat}</span>
                    <span className="text-muted-foreground">{v.done}/{v.total} · {pct}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Por dificultad */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Award size={16} className="text-primary" /> Por dificultad
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.byDifficulty).map(([k, v]) => {
              const max = Math.max(...Object.values(stats.byDifficulty), 1);
              return (
                <div key={k} className="flex items-center gap-2">
                  <span className="text-xs capitalize w-20 text-foreground">{k}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className={`h-2 rounded-full ${k === 'fácil' ? 'bg-green-500' : k === 'medio' ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${(v / max) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold w-8 text-right text-foreground">{v}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Emociones top */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Heart size={16} className="text-primary" /> Emociones más frecuentes
          </h3>
          <p className="text-xs text-muted-foreground mb-2">Promedio de intensidad: <strong className="text-foreground">{stats.emotionAvg}/5</strong></p>
          <div className="space-y-1.5">
            {stats.topEmotions.map(([emo, count]) => {
              const max = stats.topEmotions[0]?.[1] || 1;
              return (
                <div key={emo} className="flex items-center gap-2">
                  <span className="text-xs w-24 text-foreground truncate">{emo}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="h-2 rounded-full gradient-primary" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold w-6 text-right text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Objetivos */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Target size={16} className="text-primary" /> Objetivos terapéuticos
          </h3>
          <div className="grid grid-cols-3 gap-2 mb-3 text-center">
            <div className="bg-muted/50 rounded-lg p-2"><p className="text-lg font-bold text-foreground">{stats.objsActive.length}</p><p className="text-[9px] text-muted-foreground">Activos</p></div>
            <div className="bg-muted/50 rounded-lg p-2"><p className="text-lg font-bold text-success">{stats.objsCompleted.length}</p><p className="text-[9px] text-muted-foreground">Completados</p></div>
            <div className="bg-muted/50 rounded-lg p-2"><p className="text-lg font-bold text-foreground">{stats.avgObjProgress}%</p><p className="text-[9px] text-muted-foreground">Avance prom.</p></div>
          </div>
          {stats.objsActive.slice(0, 3).map(o => {
            const pct = Math.round((o.progress / o.target) * 100);
            return (
              <div key={o.id} className="mb-2">
                <div className="flex justify-between text-xs"><span className="text-foreground truncate pr-2">{o.title}</span><span className="text-muted-foreground">{pct}%</span></div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-1"><div className="bg-primary h-1.5 rounded-full" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Logros recientes */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-primary" /> Logros desbloqueados
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {stats.userAchievements.map(a => (
            <div key={a.id} className="bg-muted/50 rounded-lg p-2 text-center" title={`${a.title}: ${a.description}`}>
              <span className="text-2xl">{a.icon}</span>
              <p className="text-[9px] text-foreground font-medium mt-1 truncate">{a.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Próximos eventos */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-primary" /> Próximos eventos ({stats.upcomingEvents})
        </h3>
        <div className="space-y-2">
          {calendarEvents.filter(e => e.userId === user.id && new Date(e.date) >= new Date()).slice(0, 5).map(e => (
            <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
              <div className="w-2 h-10 rounded-full" style={{ background: e.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{e.title}</p>
                <p className="text-xs text-muted-foreground">{e.date} · {e.time}</p>
              </div>
              <Clock size={14} className="text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, accent }: { icon: string; label: string; value: string; sub: string; accent: 'primary' | 'success' | 'warning' | 'accent' }) {
  const colors: Record<string, string> = {
    primary: 'from-blue-50 to-blue-100/30 border-blue-200',
    success: 'from-green-50 to-green-100/30 border-green-200',
    warning: 'from-amber-50 to-amber-100/30 border-amber-200',
    accent: 'from-purple-50 to-purple-100/30 border-purple-200',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[accent]} rounded-xl p-3 border`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs font-medium text-foreground">{label}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}
