import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  Notification,
} from '@/data/api';
import { Bell, Check, MessageCircle, Calendar, Target, Trophy, ShieldAlert, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type UserNotificationsProps = {
  onUnreadCountChange?: (count: number) => void;
  onNavigate?: (tab: string, params?: Record<string, any>) => void;
};

const TYPE_STYLES: Record<string, { bg: string; border: string; icon: string; Icon: any; label: string }> = {
  chat:     { bg: 'bg-green-50', border: 'border-l-green-400', icon: '💬', Icon: MessageCircle, label: 'Mensaje' },
  message:  { bg: 'bg-green-50', border: 'border-l-green-400', icon: '💬', Icon: MessageCircle, label: 'Mensaje' },
  activity: { bg: 'bg-blue-50', border: 'border-l-blue-400', icon: '🎯', Icon: Target, label: 'Actividad' },
  reminder: { bg: 'bg-blue-50', border: 'border-l-blue-400', icon: '⏰', Icon: Calendar, label: 'Recordatorio' },
  achievement: { bg: 'bg-amber-50', border: 'border-l-amber-400', icon: '🏆', Icon: Trophy, label: 'Logro' },
  streak:   { bg: 'bg-orange-50', border: 'border-l-orange-400', icon: '🔥', Icon: Sparkles, label: 'Racha' },
  alert:    { bg: 'bg-red-50', border: 'border-l-red-400', icon: '⚠️', Icon: ShieldAlert, label: 'Alerta' },
  recommendation: { bg: 'bg-purple-50', border: 'border-l-purple-400', icon: '⭐', Icon: Sparkles, label: 'Recomendación' },
  system:   { bg: 'bg-slate-50', border: 'border-l-slate-400', icon: '🔔', Icon: Bell, label: 'Sistema' },
  payment:  { bg: 'bg-emerald-50', border: 'border-l-emerald-400', icon: '💰', Icon: Sparkles, label: 'Pago' },
};

function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return ts;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `hace ${diffHrs} h`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  } catch {
    return ts;
  }
}

function getNotificationDestination(notification: Notification): { tab: string; params?: Record<string, string> } {
  const source = notification.referenceType || notification.type;
  const tabMap: Record<string, string> = {
    chat: 'chat',
    message: 'chat',
    activity: 'activities',
    calendar: 'calendar',
    reminder: 'calendar',
    routine: 'routines',
    achievement: 'achievements',
    streak: 'achievements',
    payment: 'shop',
    recommendation: 'resources',
    alert: 'home',
    system: 'home',
  };
  const tab = tabMap[source] || 'home';
  const params: Record<string, string> = {};
  if (notification.sourceUserId) params.sourceUserId = notification.sourceUserId;
  if (source === 'routine') {
    if (notification.routineId) params.routineId = notification.routineId;
    if (notification.itemId) params.itemId = notification.itemId;
  }
  if (!notification.referenceId) return { tab, params: Object.keys(params).length ? params : undefined };

  const paramMap: Record<string, string> = {
    chat: 'chatId',
    message: 'chatId',
    activity: 'activityId',
    calendar: 'eventId',
    reminder: 'eventId',
    achievement: 'achievementId',
  };
  const param = paramMap[source];
  if (param) params[param] = notification.referenceId;
  return { tab, params: Object.keys(params).length ? params : undefined };
}

export default function UserNotifications({ onUnreadCountChange, onNavigate }: UserNotificationsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchMyNotifications();
      setNotifs(data);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar las notificaciones.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handleEvent = () => load();
    window.addEventListener('notification:new', handleEvent);
    return () => window.removeEventListener('notification:new', handleEvent);
  }, [load]);

  const unreadCount = notifs.filter(n => !n.read).length;
  const displayed = showAll ? notifs : notifs.filter(n => !n.read);

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [onUnreadCountChange, unreadCount]);

  const markRead = async (id: string) => {
    const notification = notifs.find(n => n.id === id);
    if (!notification || notification.read) return;

    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

    try {
      await markNotificationAsRead(id);
    } catch (error) {
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: false } : n));
      toast({ title: 'No se pudo marcar como leída', description: error instanceof Error ? error.message : 'Intentá nuevamente.', variant: 'destructive' });
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      await load();
      toast({ title: 'No se pudieron marcar las notificaciones', description: error instanceof Error ? error.message : 'Intentá nuevamente.', variant: 'destructive' });
    }
  };

  const handleClick = async (n: Notification) => {
    if (!n.read) await markRead(n.id);
    const destination = getNotificationDestination(n);
    onNavigate?.(destination.tab, destination.params);
  };

  const handleMarkRead = async (event: React.MouseEvent, id: string) => {
    event.stopPropagation();
    await markRead(id);
  };

  if (!user) return null;

  return (
    <div className="pb-24 lg:pb-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#6b4c9a] leading-tight flex items-center gap-3">
            <Bell size={22} className="text-[#6b4c9a]" /> Notificaciones
          </h2>
          <p className="text-sm sm:text-base text-[#8b7aa0] mt-1 font-medium">
            {unreadCount > 0 ? `${unreadCount} sin leer` : 'No hay notificaciones pendientes'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-[#6b4c9a] font-semibold flex items-center gap-1 hover:text-[#5a3c8a] px-3 py-1.5 rounded-lg hover:bg-[#6b4c9a]/10 transition-colors">
              <Check size={14} /> Marcar todo leído
            </button>
          )}
          {notifs.length > 0 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className={`text-xs font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${showAll ? 'text-[#6b4c9a] bg-[#6b4c9a]/10' : 'text-[#8b7aa0] hover:text-[#6b4c9a] hover:bg-[#6b4c9a]/5'}`}
            >
              {showAll ? 'Solo no leídas' : 'Ver historial'}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {loadError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p>{loadError}</p>
            <button type="button" onClick={() => void load()} className="mt-2 font-semibold underline">Reintentar</button>
          </div>
        )}
        {loading && notifs.length === 0 && (
          <div className="py-12 text-center text-sm text-[#8b7aa0]">Cargando notificaciones…</div>
        )}
        <AnimatePresence mode="popLayout">
          {!loading && !loadError && displayed.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Bell size={48} className="mx-auto text-[#d4c8e0] mb-4" />
              <p className="text-[#8b7aa0] font-medium">
                {showAll ? 'No tenés notificaciones aún' : '¡Todo al día! No tenés notificaciones pendientes'}
              </p>
            </motion.div>
          )}
          {displayed.map((n, i) => {
            const style = TYPE_STYLES[n.type] || TYPE_STYLES.system;
            const timeAgo = formatTimestamp(n.timestamp);
            return (
              <motion.button
                key={n.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.02, type: 'spring', stiffness: 300, damping: 28 }}
                onClick={() => handleClick(n)}
                className={`w-full text-left p-4 rounded-2xl border border-l-4 transition-all ${style.border} ${n.read ? `${style.bg} opacity-70 border-[#e8e0f0]` : 'bg-white border-[#e8e0f0] shadow-md hover:shadow-lg'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${n.read ? 'bg-[#f0ecf5]' : 'bg-[#f5f0fa]'}`}>
                    <span>{style.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold truncate ${n.read ? 'text-[#8b7aa0]' : 'text-[#4a4a5a]'}`}>{n.title}</p>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-[#6b4c9a] shrink-0" />}
                    </div>
                    {n.message && (
                      <p className={`text-xs mt-0.5 line-clamp-2 ${n.read ? 'text-[#b0a4c0]' : 'text-[#8b7aa0]'}`}>{n.message}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-[#b0a4c0]">{timeAgo}</span>
                      {onNavigate && (
                        <span className="text-[10px] font-semibold text-[#6b4c9a]">
                          {(n.referenceType || n.type) === 'chat' || n.type === 'message' ? 'Ir al chat →' : 'Ver →'}
                        </span>
                      )}
                      {!n.read && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(event) => void handleMarkRead(event, n.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              event.stopPropagation();
                              void markRead(n.id);
                            }
                          }}
                          className="ml-auto inline-flex items-center gap-1 rounded-lg border border-[#d8cbea] bg-white px-2 py-1 text-[10px] font-semibold text-[#6b4c9a] hover:bg-[#f5f0fa]"
                        >
                          <Check size={11} /> Marcar como leída
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
