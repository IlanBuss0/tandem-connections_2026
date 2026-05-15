import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { DayRoutine as ApiDayRoutine, fetchRoutinesForUser, RoutineItem, saveRoutinesForUser } from '@/data/api';

// Day of the week index: 0 = Domingo ... 6 = Sábado. -1 = "default/today"
export type DayKey = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DayRoutine {
  id: string;
  name: string;          // ej: "Día escolar"
  dayOfWeek: DayKey | null; // null = sin vincular
  items: RoutineItem[];
}

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

interface Ctx {
  routines: DayRoutine[];
  todayRoutine: DayRoutine | null;
  selectedRoutineId: string | null;
  setSelectedRoutineId: (id: string | null) => void;
  addRoutine: (name: string, dayOfWeek: DayKey | null) => string;
  renameRoutine: (id: string, name: string, dayOfWeek: DayKey | null) => void;
  deleteRoutine: (id: string) => void;
  duplicateRoutine: (id: string) => void;
  addItem: (routineId: string, item: Omit<RoutineItem, 'id' | 'completed'>) => void;
  updateItem: (routineId: string, itemId: string, patch: Partial<RoutineItem>) => void;
  deleteItem: (routineId: string, itemId: string) => void;
  toggleItem: (routineId: string, itemId: string) => void;
  dayNames: string[];
}

const RoutinesContext = createContext<Ctx | null>(null);

export function RoutinesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<DayRoutine[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!user) return;
    fetchRoutinesForUser(user.id)
      .then(rows => { if (mounted) setRoutines(rows as DayRoutine[]); })
      .catch(() => { if (mounted) setRoutines([]); });
    return () => { mounted = false; };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    saveRoutinesForUser(user.id, routines as ApiDayRoutine[]).catch(() => undefined);
  }, [routines, user]);

  const todayDow = new Date().getDay() as DayKey;
  const todayRoutine = useMemo(() => {
    return routines.find(r => r.dayOfWeek === todayDow) || routines[0] || null;
  }, [routines, todayDow]);

  const addRoutine = useCallback((name: string, dayOfWeek: DayKey | null) => {
    const id = `dr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setRoutines(prev => [...prev, { id, name, dayOfWeek, items: [] }]);
    return id;
  }, []);

  const renameRoutine = useCallback((id: string, name: string, dayOfWeek: DayKey | null) => {
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, name, dayOfWeek } : r));
  }, []);

  const deleteRoutine = useCallback((id: string) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
  }, []);

  const duplicateRoutine = useCallback((id: string) => {
    setRoutines(prev => {
      const orig = prev.find(r => r.id === id);
      if (!orig) return prev;
      const copy: DayRoutine = {
        ...orig,
        id: `dr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        name: `${orig.name} (copia)`,
        dayOfWeek: null,
        items: orig.items.map(it => ({ ...it, id: `${it.id}-c${Date.now().toString().slice(-4)}`, completed: false })),
      };
      return [...prev, copy];
    });
  }, []);

  const addItem: Ctx['addItem'] = useCallback((routineId, item) => {
    setRoutines(prev => prev.map(r => r.id === routineId ? {
      ...r,
      items: [...r.items, { ...item, id: `i-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, completed: false }]
        .sort((a, b) => a.time.localeCompare(b.time)),
    } : r));
  }, []);

  const updateItem: Ctx['updateItem'] = useCallback((routineId, itemId, patch) => {
    setRoutines(prev => prev.map(r => r.id === routineId ? {
      ...r,
      items: r.items.map(it => it.id === itemId ? { ...it, ...patch } : it)
        .sort((a, b) => a.time.localeCompare(b.time)),
    } : r));
  }, []);

  const deleteItem: Ctx['deleteItem'] = useCallback((routineId, itemId) => {
    setRoutines(prev => prev.map(r => r.id === routineId ? { ...r, items: r.items.filter(it => it.id !== itemId) } : r));
  }, []);

  const toggleItem: Ctx['toggleItem'] = useCallback((routineId, itemId) => {
    setRoutines(prev => prev.map(r => r.id === routineId ? {
      ...r, items: r.items.map(it => it.id === itemId ? { ...it, completed: !it.completed } : it),
    } : r));
  }, []);

  const value = useMemo<Ctx>(() => ({
    routines, todayRoutine, selectedRoutineId, setSelectedRoutineId,
    addRoutine, renameRoutine, deleteRoutine, duplicateRoutine,
    addItem, updateItem, deleteItem, toggleItem, dayNames,
  }), [routines, todayRoutine, selectedRoutineId, addRoutine, renameRoutine, deleteRoutine, duplicateRoutine, addItem, updateItem, deleteItem, toggleItem]);

  return <RoutinesContext.Provider value={value}>{children}</RoutinesContext.Provider>;
}

export function useRoutines() {
  const ctx = useContext(RoutinesContext);
  if (!ctx) throw new Error('useRoutines must be inside RoutinesProvider');
  return ctx;
}
