import { useState } from 'react';
import { motion } from 'framer-motion';
import { juanDailyRoutine, RoutineItem } from '@/data/mockData';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

export default function UserRoutines() {
  const [routine, setRoutine] = useState<RoutineItem[]>(juanDailyRoutine);

  const toggle = (id: string) => {
    setRoutine(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const completed = routine.filter(r => r.completed).length;
  const categories = ['mañana', 'escuela', 'mediodía', 'tarde', 'noche'];
  const categoryLabels: Record<string, string> = { mañana: '🌅 Mañana', escuela: '📚 Escuela', mediodía: '☀️ Mediodía', tarde: '🌤️ Tarde', noche: '🌙 Noche' };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Mi día</h2>
        <p className="text-muted-foreground text-sm">Tu rutina de hoy paso a paso</p>
      </div>

      {/* Progress */}
      <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-foreground">Progreso del día</span>
          <span className="text-sm font-bold text-primary">{Math.round((completed / routine.length) * 100)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <motion.div className="gradient-primary h-3 rounded-full" initial={{ width: 0 }} animate={{ width: `${(completed / routine.length) * 100}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{completed} de {routine.length} actividades completadas</p>
      </div>

      {/* Routine by category */}
      {categories.map(cat => {
        const items = routine.filter(r => r.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat}>
            <h3 className="font-heading font-semibold text-foreground mb-2">{categoryLabels[cat] || cat}</h3>
            <div className="space-y-2">
              {items.map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => toggle(item.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${item.completed ? 'bg-success/5 border-success/20' : 'bg-card border-border hover:border-primary/30'}`}
                >
                  {item.completed ? <CheckCircle2 size={20} className="text-success shrink-0" /> : <Circle size={20} className="text-muted-foreground shrink-0" />}
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-medium ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item.title}</p>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={12} /> {item.time}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
