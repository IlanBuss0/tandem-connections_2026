import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { juanDailyRoutine, RoutineItem } from '@/data/repo';

// Day of the week index: 0 = Domingo ... 6 = Sábado. -1 = "default/today"
export type DayKey = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DayRoutine {
  id: string;
  name: string;          // ej: "Día escolar"
  dayOfWeek: DayKey | null; // null = sin vincular
  items: RoutineItem[];
}

const KEY = (uid: string) => `tandem:routines:${uid}:v1`;

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function defaultRoutines(uid: string): DayRoutine[] {
  if (uid === 'u1') {
    // Juan: rutina escolar (lun-vie) + fin de semana
    const weekdayItems = juanDailyRoutine;
    const weekendItems: RoutineItem[] = [
      { id: 'wr1', time: '09:00', title: 'Despertarse tranquilo', icon: '⏰', completed: false, category: 'mañana' },
      { id: 'wr2', time: '09:30', title: 'Desayunar en familia', icon: '🥣', completed: false, category: 'mañana' },
      { id: 'wr3', time: '11:00', title: 'Tiempo libre', icon: '🎮', completed: false, category: 'mañana' },
      { id: 'wr4', time: '13:00', title: 'Almorzar', icon: '🍽️', completed: false, category: 'mediodía' },
      { id: 'wr5', time: '15:00', title: 'Salir / actividad', icon: '🌳', completed: false, category: 'tarde' },
      { id: 'wr6', time: '20:00', title: 'Cenar', icon: '🍝', completed: false, category: 'noche' },
      { id: 'wr7', time: '22:00', title: 'Dormir', icon: '🌙', completed: false, category: 'noche' },
    ];
    return [
      { id: 'dr-school', name: 'Día escolar', dayOfWeek: 1, items: weekdayItems.map(i => ({ ...i, completed: false })) },
      { id: 'dr-tue', name: 'Día escolar', dayOfWeek: 2, items: weekdayItems.map(i => ({ ...i, id: i.id + '-t', completed: false })) },
      { id: 'dr-wed', name: 'Día escolar', dayOfWeek: 3, items: weekdayItems.map(i => ({ ...i, id: i.id + '-w', completed: false })) },
      { id: 'dr-thu', name: 'Día escolar', dayOfWeek: 4, items: weekdayItems.map(i => ({ ...i, id: i.id + '-th', completed: false })) },
      { id: 'dr-fri', name: 'Día escolar', dayOfWeek: 5, items: weekdayItems.map(i => ({ ...i, id: i.id + '-f', completed: false })) },
      { id: 'dr-sat', name: 'Fin de semana', dayOfWeek: 6, items: weekendItems },
      { id: 'dr-sun', name: 'Fin de semana', dayOfWeek: 0, items: weekendItems.map(i => ({ ...i, id: i.id + '-s', completed: false })) },
    ];
  }
  return [
    { id: `dr-${Date.now()}`, name: 'Mi día', dayOfWeek: null, items: [] },
  ];
}

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
    if (!user) return;
    try {
      const raw = localStorage.getItem(KEY(user.id));
      if (raw) { setRoutines(JSON.parse(raw)); return; }
    } catch { /* noop */ }
    setRoutines(defaultRoutines(user.id));
  }, [user]);

  useEffect(() => {
    if (!user || routines.length === 0) return;
    try { localStorage.setItem(KEY(user.id), JSON.stringify(routines)); } catch { /* noop */ }
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
