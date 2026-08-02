import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { fetchCalendarEventsForUser, fetchEmotionRecordsForUser, type CalendarEvent } from '@/data/api';
import { buildReassuranceMessage } from '@/lib/reassuranceHistory';
import { useAuth } from '@/contexts/AuthContext';

// Unica responsabilidad: mostrar "ya hiciste esto antes" para un evento de
// calendario (Sesion 16, item 19 ⭐). Trae el historial completo del
// usuario (ya existe via fetchCalendarEventsForUser — no hace falta el log
// de uso de la Sesion 9 para esta parte, el calendario ya tiene su propio
// historial) y las emociones registradas, y delega el mensaje a la logica
// pura de reassuranceHistory.ts.
export default function ReassuranceCard({ event }: { event: CalendarEvent }) {
  const { user } = useAuth();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    Promise.all([fetchCalendarEventsForUser(user.id), fetchEmotionRecordsForUser(user.id)])
      .then(([events, emotions]) => {
        if (cancelled) return;
        const past = events.filter((e) => e.type === event.type && e.date < event.date);
        setMessage(buildReassuranceMessage(past, emotions));
      })
      .catch(() => { if (!cancelled) setMessage(null); });
    return () => { cancelled = true; };
  }, [user?.id, event.type, event.date]);

  if (!message) return null;

  return (
    <div className="mt-1.5 flex items-start gap-2 rounded-lg bg-green-50 p-2 text-xs text-green-800">
      <Heart size={14} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
