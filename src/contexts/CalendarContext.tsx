import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { CalendarEvent, createCalendarEvent, deleteCalendarEvent, fetchCalendarEventsForUser, updateCalendarEvent } from '@/data/api';

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
}

const CalendarContext = createContext<Ctx | null>(null);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchCalendarEventsForUser(user.id);
      setEvents(data);
    } catch {
      setEvents([]);
    }
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [user, fetchEvents]);

  const addEvent: Ctx['addEvent'] = useCallback(async (data) => {
    if (!user) return;
    const created = await createCalendarEvent(user.id, { ...data, color: typeColor[data.type] });
    setEvents(prev => {
      if (prev.some(e => e.id === created.id)) return prev;
      return [...prev, created];
    });
    fetchEvents();
  }, [user, fetchEvents]);

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

  const value = useMemo(() => ({ events, addEvent, updateEvent: updateEventFn, deleteEvent: deleteEventFn, eventsOn }), [events, addEvent, updateEventFn, deleteEventFn, eventsOn]);
  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function useCalendar() {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error('useCalendar must be inside CalendarProvider');
  return ctx;
}
