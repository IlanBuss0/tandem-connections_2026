import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  ClipboardList,
  Clock3,
  HeartHandshake,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
} from 'lucide-react';
import AvatarPreview from '@/components/AvatarPreview';
import CoinBadge from '@/components/CoinBadge';
import { fetchPertenecienteHome, PertenecienteHomeData } from '@/data/api';

interface Props {
  onNavigate?: (tab: string) => void;
}

const emptyHome: PertenecienteHomeData = {
  perteneciente: null,
  supportLevel: 'Sin registrar',
  autonomy: 'Sin registrar',
  canSelfManage: false,
  points: 0,
  level: 1,
  experience: 0,
  activities: [],
  notifications: [],
};

export default function UserHome({ onNavigate }: Props) {
  const { user } = useAuth();
  const [home, setHome] = useState<PertenecienteHomeData>(emptyHome);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    if (!user || user.role !== 'user') return;

    setLoading(true);
    setError('');
    fetchPertenecienteHome(user.id)
      .then(data => {
        if (!mounted) return;
        setHome(data);
      })
      .catch(() => {
        if (!mounted) return;
        setHome(emptyHome);
        setError('No pude cargar tus datos del backend local.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  const stats = useMemo(() => {
    const total = home.activities.length;
    const completed = home.activities.filter(activity => activity.completed).length;
    const pending = Math.max(total - completed, 0);
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, progress };
  }, [home.activities]);

  if (!user || user.role !== 'user') return null;

  const firstName = user.name.split(' ')[0] || user.username;
  const pendingActivities = home.activities.filter(activity => !activity.completed);
  const recentActivities = pendingActivities.length > 0 ? pendingActivities : home.activities;
  const unreadNotifications = home.notifications.filter(notification => !notification.read);

  return (
    <div className="space-y-5 sm:space-y-6 pb-24 lg:pb-6">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <AvatarPreview equipped={{}} size={88} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-primary">Home de perteneciente</p>
              <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
                Hola, {firstName}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tu resumen se actualiza desde el backend local de Tandem.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CoinBadge size="sm" />
            <button
              onClick={() => onNavigate?.('activities')}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              <ClipboardList size={16} />
              Actividades
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </motion.section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: Star, label: 'Puntos', value: home.points.toString(), color: 'text-amber-600', bg: 'bg-amber-50' },
          { icon: Trophy, label: 'Nivel', value: home.level.toString(), color: 'text-violet-600', bg: 'bg-violet-50' },
          { icon: CheckCircle2, label: 'Completadas', value: `${stats.completed}/${stats.total}`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { icon: Clock3, label: 'Pendientes', value: stats.pending.toString(), color: 'text-sky-600', bg: 'bg-sky-50' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`${stat.bg} rounded-xl border border-border/40 p-4`}
          >
            <stat.icon size={20} className={stat.color} />
            <p className="mt-2 text-xl font-bold text-foreground">{loading ? '...' : stat.value}</p>
            <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-heading text-lg font-semibold text-foreground">Actividades asignadas</h3>
              <p className="text-sm text-muted-foreground">{stats.progress}% completado</p>
            </div>
            <button
              onClick={() => onNavigate?.('activities')}
              className="text-sm font-medium text-primary hover:underline"
            >
              Ver todas
            </button>
          </div>

          <div className="mb-4 h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${stats.progress}%` }} />
          </div>

          <div className="space-y-3">
            {loading && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                <RefreshCw size={16} className="animate-spin" />
                Cargando actividades...
              </div>
            )}

            {!loading && recentActivities.slice(0, 5).map(activity => (
              <div key={activity.id} className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${activity.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary'}`}>
                  {activity.completed ? <CheckCircle2 size={18} /> : <ClipboardList size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{activity.title}</p>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {activity.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{activity.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Asignada: {activity.assignedAt}</p>
                </div>
              </div>
            ))}

            {!loading && recentActivities.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-5 text-center">
                <Sparkles size={22} className="mx-auto text-primary" />
                <p className="mt-2 font-medium text-foreground">Todavia no tenes actividades asignadas</p>
                <p className="text-sm text-muted-foreground">Cuando tu equipo cargue actividades, van a aparecer aca.</p>
              </div>
            )}
          </div>
        </motion.section>

        <div className="space-y-5">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <h3 className="font-heading text-lg font-semibold text-foreground">Perfil de apoyo</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3">
                <HeartHandshake size={19} className="mt-0.5 text-primary" />
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Nivel de apoyo</p>
                  <p className="font-medium text-foreground">{loading ? 'Cargando...' : home.supportLevel}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck size={19} className="mt-0.5 text-primary" />
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Autonomia</p>
                  <p className="font-medium text-foreground">{loading ? 'Cargando...' : home.autonomy}</p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                {home.canSelfManage ? 'Autogestion habilitada para acciones permitidas.' : 'Autogestion pendiente de habilitacion o revision.'}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-heading text-lg font-semibold text-foreground">Notificaciones</h3>
              <button onClick={() => onNavigate?.('notifications')} className="text-sm font-medium text-primary hover:underline">
                Ver
              </button>
            </div>

            <div className="space-y-2">
              {unreadNotifications.slice(0, 4).map(notification => (
                <div key={notification.id} className="flex gap-3 rounded-lg bg-muted/50 p-3">
                  <Bell size={17} className="mt-0.5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                  </div>
                </div>
              ))}

              {!loading && unreadNotifications.length === 0 && (
                <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                  No tenes notificaciones nuevas.
                </p>
              )}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
