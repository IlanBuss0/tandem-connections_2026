import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { CalendarEvent, createCalendarEvent, deleteCalendarEvent, fetchCalendarEventsForUser, updateCalendarEvent } from '@/data/api';
import { fetchPatternsReport, type EventTypePattern } from '@/data/usageApi';

export const eventTypes = ['mañana', 'escuela', 'mediodía', 'tarde', 'noche'];
export const typeColor: Record<string, string> = {
  terapia: 'hsl(270 40% 75%)', escuela: 'hsl(210 70% 55%)', personal: 'hsl(30 80% 60%)', médico: 'hsl(0 72% 55%)', social: 'hsl(150 60% 45%)', actividad: 'hsl(45 90% 55%)',
  mañana: 'hsl(35 85% 62%)', mediodía: 'hsl(45 90% 55%)', tarde: 'hsl(270 40% 75%)', noche: 'hsl(240 50% 65%)',
};
export const typeEmoji: Record<string, string> = {
  terapia: '🧠', escuela: '📚', personal: '🎵', médico: '🏥', social: '👥', actividad: '⭐',
  mañana: '🌅', mediodía: '☀️', tarde: '🌤️', noche: '🌙',
};

interface Ctx {
  events: CalendarEvent[];
  addEvent: (data: Omit<CalendarEvent, 'id' | 'userId' | 'color'>) => Promise<void>;
  updateEvent: (id: string, patch: Partial<Omit<CalendarEvent, 'id' | 'userId'>>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  eventsOn: (date: string) => CalendarEvent[];
  // Sesion 25 (perfil de memoria): tipos de evento que historicamente se
  // asocian con animo dificil para esta persona (mismo dato que "Patrones
  // detectados" en el panel del tutor, S20) — lo usa UserCalendar.tsx para
  // sugerir (nunca forzar) preparar una historia social al crear un evento
  // de un tipo asi.
  eventTypePatterns: EventTypePattern[];
}

const CalendarContext = createContext<Ctx | null>(null);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventTypePatterns, setEventTypePatterns] = useState<EventTypePattern[]>([]);

  const fetchEvents = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await fetchCalendarEventsForUser(userId);
      setEvents(data);
    } catch {
      setEvents([]);
    }
  }, [userId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (!userId) return;
    fetchPatternsReport(userId).then((report) => setEventTypePatterns(report?.eventTypePatterns || []));
  }, [userId]);

  const addEvent: Ctx['addEvent'] = useCallback(async (data) => {
    if (!userId) return;
    const created = await createCalendarEvent(userId, { ...data, color: typeColor[data.type] });
    setEvents(prev => {
      if (prev.some(e => e.id === created.id)) return prev;
      return [...prev, created];
    });
    fetchEvents();
  }, [userId, fetchEvents]);

  const updateEventFn: Ctx['updateEvent'] = useCallback(async (id, patch) => {
    const updated = await updateCalendarEvent(id, { ...patch, color: patch.type ? typeColor[patch.type] : undefined });
    setEvents(prev => prev.map(e => e.id === id ? updated : e));
    fetchEvents();
  }, [fetchEvents]);

  const deleteEventFn: Ctx['deleteEvent'] = useCallback(async (id: string) => {
    await deleteCalendarEvent(id);
    setEvents(prev => prev.filter(e => e.id !== id));
    fetchEvents();
  }, [fetchEvents]);

  const eventsOn = useCallback((date: string) => events.filter(e => e.date === date), [events]);

  const value = useMemo(
    () => ({ events, addEvent, updateEvent: updateEventFn, deleteEvent: deleteEventFn, eventsOn, eventTypePatterns }),
    [events, addEvent, updateEventFn, deleteEventFn, eventsOn, eventTypePatterns],
  );
  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function useCalendar() {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error('useCalendar must be inside CalendarProvider');
  return ctx;
}
