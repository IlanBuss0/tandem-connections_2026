import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getActivitiesForUser, activities as allActivities, Activity, ActivityCategory } from '@/data/mockData';
import { CheckCircle2, Clock, Star, Filter, ChevronDown, ChevronUp, Play, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export default function UserActivities({ filter }: { filter: 'all' | 'recommended' }) {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [localActivities, setLocalActivities] = useState(allActivities);

  if (!user) return null;

  let filtered = filter === 'recommended'
    ? localActivities.filter(a => a.assignedTo === user.id)
    : localActivities;

  if (selectedCategory !== 'todas') {
    filtered = filtered.filter(a => a.category === selectedCategory);
  }

  const categories = ['todas', ...Array.from(new Set(allActivities.map(a => a.category)))];

  const completeActivity = (id: string) => {
    setLocalActivities(prev => prev.map(a => a.id === id ? { ...a, status: 'completada' as const, progress: 100 } : a));
  };

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
                  {activity.status === 'completada' && <CheckCircle2 size={14} className="text-success" />}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${difficultyColors[activity.difficulty]}`}>{activity.difficulty}</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock size={10} /> {activity.duration}</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Award size={10} /> {activity.points} pts</span>
                </div>
                {activity.recommendedByName && (
                  <p className="text-[10px] text-primary mt-1">Recomendada por {activity.recommendedByName}</p>
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
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center shrink-0 font-bold">{si + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
                {activity.status !== 'completada' && (
                  <Button size="sm" className="mt-4 w-full gradient-primary text-primary-foreground" onClick={() => completeActivity(activity.id)}>
                    <CheckCircle2 size={14} className="mr-1" /> Completar actividad
                  </Button>
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
