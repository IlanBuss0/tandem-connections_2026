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
    <div className="pb-24 lg:pb-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#6b4c9a] leading-tight flex items-center gap-3">
            <Bell size={22} className="text-[#6b4c9a]" /> Notificaciones
          </h2>
          <p className="text-sm sm:text-base text-[#8b7aa0] mt-1 font-medium">{unreadCount} sin leer</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-[#6b4c9a] font-semibold flex items-center gap-1 hover:text-[#5a3c8a]">
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
            className={`w-full text-left p-4 rounded-2xl border border-l-4 transition-all ${typeColors[n.type] || 'border-l-muted'} ${n.read ? 'bg-[#faf8ff] border-[#f0e8f8] opacity-60' : 'bg-white border-[#f0e8f8] shadow-md'}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{n.icon}</span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${n.read ? 'text-[#8b7aa0]' : 'text-[#4a4a5a]'}`}>{n.title}</p>
                <p className="text-xs text-[#8b7aa0] mt-0.5">{n.message}</p>
                {n.actionLabel && !n.read && (
                  <span className="text-xs text-[#6b4c9a] font-semibold mt-1 inline-block">{n.actionLabel} →</span>
                )}
              </div>
              <span className="text-[10px] text-[#8b7aa0] shrink-0">{n.timestamp}</span>
              {!n.read && <span className="w-2 h-2 rounded-full bg-[#6b4c9a] shrink-0 mt-1" />}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
