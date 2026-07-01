import { useEffect, useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { fetchMyNotifications } from '@/data/api';

type NotificationUser = {
  id: string;
} | null;

export function useUnreadNotifications(user: NotificationUser) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    fetchMyNotifications()
      .then((notifications) => {
        setUnreadCount(notifications.filter(notification => !notification.read).length);
      })
      .catch(() => {
        // Preserve the last valid count during temporary API failures.
      });
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    refresh();

    const intervalId = setInterval(refresh, 15000);

    const handleNotificationEvent = () => {
      refresh();
    };

    window.addEventListener('notification:new', handleNotificationEvent);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('notification:new', handleNotificationEvent);
    };
  }, [refresh, user]);

  return { unreadCount, setUnreadCount };
}

type NotificationBellButtonProps = {
  count: number;
  onClick: () => void;
  className?: string;
  dark?: boolean;
};

export default function NotificationBellButton({
  count,
  onClick,
  className = '',
  dark = false,
}: NotificationBellButtonProps) {
  const hasUnread = count > 0;
  const baseColor = dark ? 'text-slate-300 border-slate-700 bg-slate-900/70 hover:bg-slate-800' : 'text-muted-foreground border-border bg-card hover:bg-muted';
  const unreadColor = dark ? 'text-red-300 border-red-500/70 bg-red-950/50 hover:bg-red-950/70' : 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100';

  return (
    <button
      onClick={onClick}
      className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition ${hasUnread ? unreadColor : baseColor} ${className}`}
      aria-label={hasUnread ? `${count} notificaciones pendientes` : 'Notificaciones'}
    >
      <Bell size={18} />
      {hasUnread && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white shadow-sm">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
