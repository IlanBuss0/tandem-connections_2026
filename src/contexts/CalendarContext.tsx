import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { calendarEvents as seed, CalendarEvent } from '@/data/mockData';

const KEY = (uid: string) => `tandem:calendar:${uid}:v1`;

export const eventTypes: CalendarEvent['type'][] = ['terapia', 'escuela', 'personal', 'médico', 'social', 'actividad'];
export const typeColor: Record<CalendarEvent['type'], string> = {
  terapia: 'hsl(270 40% 75%)',
  escuela: 'hsl(210 70% 55%)',
  personal: 'hsl(30 80% 60%)',
  médico: 'hsl(0 72% 55%)',
  social: 'hsl(150 60% 45%)',
  actividad: 'hsl(45 90% 55%)',
};
export const typeEmoji: Record<CalendarEvent['type'], string> = {
  terapia: '🧠', escuela: '📚', personal: '🎵', médico: '🏥', social: '👥', actividad: '⭐',
};

interface Ctx {
  events: CalendarEvent[];
  addEvent: (data: Omit<CalendarEvent, 'id' | 'userId' | 'color'>) => void;
  updateEvent: (id: string, patch: Partial<Omit<CalendarEvent, 'id' | 'userId'>>) => void;
  deleteEvent: (id: string) => void;
  eventsOn: (date: string) => CalendarEvent[];
}

const CalendarContext = createContext<Ctx | null>(null);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(KEY(user.id));
      if (raw) { setEvents(JSON.parse(raw)); return; }
    } catch { /* noop */ }
    setEvents(seed.filter(e => e.userId === user.id));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    try { localStorage.setItem(KEY(user.id), JSON.stringify(events)); } catch { /* noop */ }
  }, [events, user]);

  const addEvent: Ctx['addEvent'] = useCallback((data) => {
    if (!user) return;
    const newEv: CalendarEvent = {
      ...data,
      id: `ce-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      userId: user.id,
      color: typeColor[data.type],
    };
    setEvents(prev => [...prev, newEv]);
  }, [user]);

  const updateEvent: Ctx['updateEvent'] = useCallback((id, patch) => {
    setEvents(prev => prev.map(e => e.id === id ? {
      ...e, ...patch, color: patch.type ? typeColor[patch.type] : e.color,
    } : e));
  }, []);

  const deleteEvent = useCallback((id: string) => setEvents(prev => prev.filter(e => e.id !== id)), []);

  const eventsOn = useCallback((date: string) => events.filter(e => e.date === date), [events]);

  const value = useMemo(() => ({ events, addEvent, updateEvent, deleteEvent, eventsOn }), [events, addEvent, updateEvent, deleteEvent, eventsOn]);
  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function useCalendar() {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error('useCalendar must be inside CalendarProvider');
  return ctx;
}
