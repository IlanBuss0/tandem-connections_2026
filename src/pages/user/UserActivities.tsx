import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomActivities } from '@/contexts/CustomActivitiesContext';
import { getActivitiesForUser, activities as allActivities, Activity, ActivityCategory } from '@/data/mockData';
import { CheckCircle2, Clock, Award, ChevronDown, ChevronUp, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ActivityExecution from './ActivityExecution';

const categoryEmoji: Record<string, string> = {
  'autonomía personal': '🦸', higiene: '🧼', organización: '📋', escuela: '📚', 'cocina básica': '🍳',
  transporte: '🚌', compras: '🛒', 'manejo del dinero': '💰', emociones: '💭', comunicación: '💬',
  'vida social': '👥', 'seguridad personal': '🛡️', 'rutinas del hogar': '🏠', 'regulación emocional': '🧘',
  'preparación para salidas': '🚪', 'anticipación de cambios': '🔄',
};

const difficultyColors: Record<string, string> = {
  fácil: 'bg-green-100 text-green-700',
  medio: 'bg-amber-100 text-amber-700',
  avanzado: 'bg-red-100 text-red-700',
};

const typeColors: Record<string, string> = {
  guiada: 'bg-blue-100 text-blue-700',
  juego: 'bg-green-100 text-green-700',
  regulación: 'bg-purple-100 text-purple-700',
  decisión: 'bg-amber-100 text-amber-700',
};

export default function UserActivities({ filter }: { filter: 'all' | 'recommended' }) {
  const { user } = useAuth();
  const { forUser } = useCustomActivities();
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [localActivities, setLocalActivities] = useState(allActivities);
  const [executingActivity, setExecutingActivity] = useState<Activity | null>(null);

  // Custom activities asignadas a este usuario
  const customForUser = useMemo(() => user ? forUser(user.id) : [], [user, forUser]);
  const merged = useMemo(() => {
    // Custom siempre van primero (más recientes)
    return [...customForUser, ...localActivities];
  }, [customForUser, localActivities]);

  if (!user) return null;

  if (executingActivity) {
    return (
      <ActivityExecution
        activity={executingActivity}
        onBack={() => setExecutingActivity(null)}
        onComplete={(id) => setLocalActivities(prev => prev.map(a => a.id === id ? { ...a, status: 'completada' as const, progress: 100 } : a))}
      />
    );
  }

  let filtered = filter === 'recommended'
    ? merged.filter(a => a.assignedTo === user.id || (a as any).assignedToIds?.includes(user.id))
    : merged;

  if (selectedCategory !== 'todas') {
    filtered = filtered.filter(a => a.category === selectedCategory);
  }

  const categories = ['todas', ...Array.from(new Set(allActivities.map(a => a.category)))];

  const completeActivity = (id: string) => {
    setLocalActivities(prev => prev.map(a => a.id === id ? { ...a, status: 'completada' as const, progress: 100 } : a));
  };

  // Daily challenge
  const dailyActivity = localActivities.find(a => a.assignedTo === user.id && a.status === 'pendiente' && a.type === 'regulación') || localActivities.find(a => a.assignedTo === user.id && a.status === 'pendiente');

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">
          {filter === 'recommended' ? '⭐ Recomendadas para vos' : 'Actividades'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {filter === 'recommended' ? 'Actividades seleccionadas especialmente para vos' : 'Todas las actividades disponibles'}
        </p>
      </div>

      {/* Daily challenge */}
      {filter === 'recommended' && dailyActivity && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="gradient-primary rounded-xl p-4 text-primary-foreground">
          <p className="text-xs font-medium opacity-80">🎯 Actividad del día</p>
          <p className="font-heading font-bold mt-1">{dailyActivity.title}</p>
          <p className="text-xs opacity-80 mt-1">{dailyActivity.description.slice(0, 80)}...</p>
          <Button size="sm" variant="outline" className="mt-3 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setExecutingActivity(dailyActivity)}>
            <Play size={14} className="mr-1" /> Empezar ahora
          </Button>
        </motion.div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedCategory === cat ? 'gradient-primary text-primary-foreground border-transparent' : 'bg-card border-border text-muted-foreground hover:border-primary/30'}`}
          >
            {cat === 'todas' ? '📌 Todas' : `${categoryEmoji[cat] || '📌'} ${cat}`}
          </button>
        ))}
      </div>

      {/* Activities list */}
      <div className="space-y-3">
        {filtered.map((activity, i) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`bg-card rounded-xl border shadow-sm overflow-hidden ${activity.status === 'completada' ? 'border-success/30' : 'border-border'}`}
          >
            <button
              onClick={() => setExpandedId(expandedId === activity.id ? null : activity.id)}
              className="w-full p-4 flex items-start gap-3 text-left"
            >
              <span className="text-2xl shrink-0">{categoryEmoji[activity.category] || '📌'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`font-medium text-sm ${activity.status === 'completada' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{activity.title}</p>
                  {(activity as any).isCustom && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary flex items-center gap-0.5"><Sparkles size={9} />Personalizada</span>}
                  {activity.status === 'completada' && <CheckCircle2 size={14} className="text-success" />}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${difficultyColors[activity.difficulty]}`}>{activity.difficulty}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${typeColors[activity.type]}`}>{activity.type}</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock size={10} /> {activity.duration}</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Award size={10} /> {activity.points} pts</span>
                </div>
                {activity.recommendedByName && (
                  <p className="text-[10px] text-primary mt-1">
                    {activity.recommendedBy === 'tutor' ? '👩 ' : activity.recommendedBy === 'profesional' ? '👩‍⚕️ ' : '🤖 '}
                    Recomendada por {activity.recommendedByName}
                  </p>
                )}
                {activity.progress > 0 && activity.progress < 100 && (
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${activity.progress}%` }} />
                  </div>
                )}
              </div>
              {expandedId === activity.id ? <ChevronUp size={16} className="text-muted-foreground shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
            </button>

            {expandedId === activity.id && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="px-4 pb-4 border-t border-border/50 pt-3">
                <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                <p className="text-xs font-semibold text-foreground mb-1">🎯 Objetivo: {activity.objective}</p>
                <div className="mt-3">
                  <p className="text-xs font-semibold text-foreground mb-2">Pasos:</p>
                  <ol className="space-y-1.5">
                    {activity.steps.map((step, si) => (
                      <li key={si} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center shrink-0 font-bold">{activity.stepIcons?.[si] || si + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
                {activity.status !== 'completada' && (
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" className="flex-1 gradient-primary text-primary-foreground" onClick={() => setExecutingActivity(activity)}>
                      <Play size={14} className="mr-1" /> Empezar actividad
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => completeActivity(activity.id)}>
                      <CheckCircle2 size={14} className="mr-1" /> Marcar completada
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-3xl mb-2">📭</p>
          <p>No hay actividades en esta categoría</p>
        </div>
      )}
    </div>
  );
}
