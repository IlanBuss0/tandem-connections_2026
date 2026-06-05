import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchNotificationsForUser,
  markNotificationAsRead,
  markNotificationsAsRead,
  Notification,
} from '@/data/api';
import { Bell, Check } from 'lucide-react';

type UserNotificationsProps = {
  onUnreadCountChange?: (count: number) => void;
};

export default function UserNotifications({ onUnreadCountChange }: UserNotificationsProps) {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notification[]>([]);

  useEffect(() => {
    let mounted = true;
    if (!user) return;
    fetchNotificationsForUser(user.id).then((data) => {
      if (mounted) setNotifs(data.filter(notification => !notification.read));
    }).catch(() => {
      if (mounted) setNotifs([]);
    });
    return () => { mounted = false; };
  }, [user]);

  const unreadCount = notifs.filter(n => !n.read).length;

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [onUnreadCountChange, unreadCount]);

  if (!user) return null;

  const markRead = async (id: string) => {
    const notification = notifs.find(n => n.id === id);
    if (!notification || notification.read) return;

    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

    try {
      await markNotificationAsRead(id);
      setNotifs(prev => prev.filter(n => n.id !== id));
    } catch {
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: false } : n));
    }
  };

  const markAllRead = async () => {
    const unreadIds = notifs.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    setNotifs(prev => prev.map(n => ({ ...n, read: true })));

    try {
      await markNotificationsAsRead(unreadIds);
      setNotifs(prev => prev.filter(n => !unreadIds.includes(n.id)));
    } catch {
      setNotifs(prev => prev.map(n => unreadIds.includes(n.id) ? { ...n, read: false } : n));
    }
  };

  const typeColors: Record<string, string> = {
    reminder: 'border-l-blue-400', achievement: 'border-l-amber-400', message: 'border-l-green-400',
    alert: 'border-l-red-400', recommendation: 'border-l-purple-400', streak: 'border-l-orange-400',
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Bell size={22} className="text-primary" /> Notificaciones
          </h2>
          <p className="text-muted-foreground text-sm">{unreadCount} sin leer</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-primary font-medium flex items-center gap-1">
            <Check size={14} /> Marcar todo como leído
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifs.map((n, i) => (
          <motion.button
            key={n.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => markRead(n.id)}
            className={`w-full text-left p-4 rounded-xl border border-l-4 transition-all ${typeColors[n.type] || 'border-l-muted'} ${n.read ? 'bg-card border-border opacity-70' : 'bg-card border-border shadow-sm'}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{n.icon}</span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${n.read ? 'text-muted-foreground' : 'text-foreground'}`}>{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                {n.actionLabel && !n.read && (
                  <span className="text-xs text-primary font-medium mt-1 inline-block">{n.actionLabel} →</span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{n.timestamp}</span>
              {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
