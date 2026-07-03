import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { DayRoutine as ApiDayRoutine, fetchRoutinesForUser, RoutineItem, saveRoutinesForUser, CustomCategory, fetchCustomCategoriesForUser, saveCustomCategoriesForUser } from '@/data/api';

// Day of the week index: 0 = Domingo ... 6 = Sábado. -1 = "default/today"
export type DayKey = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DayRoutine {
  id: string;
  name: string;          // ej: "Día escolar"
  dayOfWeek: DayKey | null; // null = sin vincular
  items: RoutineItem[];
  date?: string;          // DD/MM/AAAA para identificar rutinas con el mismo nombre
}

export const predefinedCategories = ['mañana', 'escuela', 'mediodía', 'tarde', 'noche'];
export const predefinedLabels: Record<string, string> = { mañana: '🌅 Mañana', escuela: '📚 Escuela', mediodía: '☀️ Mediodía', tarde: '🌤️ Tarde', noche: '🌙 Noche' };
export const iconChoices = ['⏰','🛏️','🚿','👕','🥣','🪥','🎒','🚶','📚','🍽️','🎮','✏️','⭐','🥪','🧠','🎧','👔','🍝','💭','🌙','🏃','🎵','📖','🧘','🐶','🛁','💊','🥗','🌳','🎨'];

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function todayDate(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

interface Ctx {
  routines: DayRoutine[];
  todayRoutine: DayRoutine | null;
  selectedRoutineId: string | null;
  setSelectedRoutineId: (id: string | null) => void;
  addRoutine: (name: string, dayOfWeek: DayKey | null, date?: string) => string;
  renameRoutine: (id: string, name: string, dayOfWeek: DayKey | null, date?: string) => void;
  deleteRoutine: (id: string) => void;
  duplicateRoutine: (id: string) => void;
  addItem: (routineId: string, item: Omit<RoutineItem, 'id' | 'completed'>) => void;
  updateItem: (routineId: string, itemId: string, patch: Partial<RoutineItem>) => void;
  deleteItem: (routineId: string, itemId: string) => void;
  toggleItem: (routineId: string, itemId: string) => void;
  customCategories: CustomCategory[];
  addCustomCategory: (name: string, icon: string) => void;
  updateCustomCategory: (id: string, name: string, icon: string) => void;
  deleteCustomCategory: (id: string) => void;
  hiddenPredefined: string[];
  toggleHiddenPredefined: (id: string) => void;
  dayNames: string[];
}

const RoutinesContext = createContext<Ctx | null>(null);

export function RoutinesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<DayRoutine[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [hiddenPredefined, setHiddenPredefined] = useState<string[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!user || user.role !== 'user') {
      setRoutines([]);
      setCustomCategories([]);
      setHiddenPredefined([]);
      setLoadedUserId(null);
      return;
    }
    setLoadedUserId(null);
    Promise.all([
      fetchRoutinesForUser(user.id),
      fetchCustomCategoriesForUser(user.id),
    ]).then(([rows, data]) => {
      if (!mounted) return;
      setRoutines(rows as DayRoutine[]);
      setCustomCategories(data.customCategories);
      setHiddenPredefined(data.hiddenPredefined);
      setLoadedUserId(user.id);
    }).catch(() => {
      if (!mounted) return;
      setRoutines([]);
      setCustomCategories([]);
      setHiddenPredefined([]);
      setLoadedUserId(user.id);
    });
    return () => { mounted = false; };
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'user' || loadedUserId !== user.id) return;
    const timer = window.setTimeout(() => {
      saveRoutinesForUser(user.id, routines as ApiDayRoutine[]).catch(() => undefined);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [routines, user, loadedUserId]);

  useEffect(() => {
    if (!user || user.role !== 'user' || loadedUserId !== user.id) return;
    saveCustomCategoriesForUser(user.id, customCategories, hiddenPredefined).catch(() => undefined);
  }, [customCategories, hiddenPredefined, user, loadedUserId]);

  const todayDow = new Date().getDay() as DayKey;
  const todayRoutine = useMemo(() => {
    return routines.find(r => r.dayOfWeek === todayDow) || routines[0] || null;
  }, [routines, todayDow]);

  const addRoutine = useCallback((name: string, dayOfWeek: DayKey | null, date?: string) => {
    const id = `dr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setRoutines(prev => [...prev, { id, name, dayOfWeek, items: [], date: date || todayDate() }]);
    return id;
  }, []);

  const renameRoutine = useCallback((id: string, name: string, dayOfWeek: DayKey | null, date?: string) => {
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, name, dayOfWeek, ...(date !== undefined && { date }) } : r));
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
        date: todayDate(),
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

  const addCustomCategory = useCallback((name: string, icon: string) => {
    const id = `cc-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setCustomCategories(prev => [...prev, { id, name, icon }]);
  }, []);

  const updateCustomCategory = useCallback((id: string, name: string, icon: string) => {
    setCustomCategories(prev => prev.map(c => c.id === id ? { ...c, name, icon } : c));
  }, []);

  const deleteCustomCategory = useCallback((id: string) => {
    setCustomCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  const toggleHiddenPredefined = useCallback((id: string) => {
    setHiddenPredefined(prev => prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]);
  }, []);

  const value = useMemo<Ctx>(() => ({
    routines, todayRoutine, selectedRoutineId, setSelectedRoutineId,
    addRoutine, renameRoutine, deleteRoutine, duplicateRoutine,
    addItem, updateItem, deleteItem, toggleItem, dayNames,
    customCategories, addCustomCategory, updateCustomCategory, deleteCustomCategory,
    hiddenPredefined, toggleHiddenPredefined,
  }), [routines, todayRoutine, selectedRoutineId, customCategories, hiddenPredefined,
    addRoutine, renameRoutine, deleteRoutine, duplicateRoutine,
    addItem, updateItem, deleteItem, toggleItem,
    addCustomCategory, updateCustomCategory, deleteCustomCategory, toggleHiddenPredefined]);

  return <RoutinesContext.Provider value={value}>{children}</RoutinesContext.Provider>;
}

export function useRoutines() {
  const ctx = useContext(RoutinesContext);
  if (!ctx) throw new Error('useRoutines must be inside RoutinesProvider');
  return ctx;
}
