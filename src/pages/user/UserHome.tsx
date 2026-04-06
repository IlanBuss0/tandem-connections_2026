import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { getActivitiesForUser, getNotificationsForUser, getObjectivesForUser, juanDailyRoutine } from '@/data/mockData';
import { CheckCircle2, Clock, Flame, Star, Trophy, Bell, TrendingUp, Target } from 'lucide-react';

export default function UserHome() {
  const { user } = useAuth();
  if (!user || user.role !== 'user') return null;

  const activities = getActivitiesForUser(user.id);
  const notifications = getNotificationsForUser(user.id).filter(n => !n.read);
  const objectives = getObjectivesForUser(user.id).filter(o => o.status === 'activo');
  const completedToday = juanDailyRoutine.filter(r => r.completed).length;
  const totalRoutine = juanDailyRoutine.length;
  const completedActivities = activities.filter(a => a.status === 'completada').length;

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-heading font-bold text-foreground">¡Hola, {user.name.split(' ')[0]}! 👋</h2>
        <p className="text-muted-foreground text-sm mt-1">Veamos cómo va tu día</p>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Flame, label: 'Racha', value: `${user.streak} días`, color: 'text-orange-500', bg: 'bg-orange-50' },
          { icon: Star, label: 'Puntos', value: user.points.toString(), color: 'text-amber-500', bg: 'bg-amber-50' },
          { icon: Trophy, label: 'Nivel', value: user.level.toString(), color: 'text-purple-500', bg: 'bg-purple-50' },
          { icon: CheckCircle2, label: 'Completadas', value: `${completedActivities}/${activities.length}`, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`${stat.bg} rounded-xl p-4 border border-border/30`}>
            <stat.icon size={20} className={stat.color} />
            <p className="text-lg font-bold text-foreground mt-2">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Today's routine progress */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-xl p-4 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <Clock size={18} className="text-primary" /> Rutina de hoy
          </h3>
          <span className="text-sm font-medium text-primary">{completedToday}/{totalRoutine}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3 mb-3">
          <div className="gradient-primary h-3 rounded-full transition-all" style={{ width: `${(completedToday / totalRoutine) * 100}%` }} />
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {juanDailyRoutine.slice(0, 8).map(item => (
            <div key={item.id} className={`flex items-center gap-3 text-sm py-1 ${item.completed ? 'opacity-60' : ''}`}>
              <span>{item.completed ? '✅' : '⬜'}</span>
              <span className="text-muted-foreground w-12">{item.time}</span>
              <span className={item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}>{item.title}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Active objectives */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card rounded-xl p-4 border border-border shadow-sm">
        <h3 className="font-heading font-semibold text-foreground flex items-center gap-2 mb-3">
          <Target size={18} className="text-secondary" /> Objetivos activos
        </h3>
        <div className="space-y-3">
          {objectives.slice(0, 4).map(obj => (
            <div key={obj.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-foreground font-medium">{obj.title}</span>
                <span className="text-muted-foreground">{obj.progress}/{obj.target} {obj.unit}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${(obj.progress / obj.target) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <h3 className="font-heading font-semibold text-foreground flex items-center gap-2 mb-3">
            <Bell size={18} className="text-accent" /> Notificaciones nuevas
          </h3>
          <div className="space-y-2">
            {notifications.slice(0, 5).map(n => (
              <div key={n.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                <span className="text-lg">{n.icon}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
