import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { Activity, ActivityCategory, ActivityType } from '@/data/api';

export interface CustomActivity extends Activity {
  isCustom: true;
  status: 'pendiente' | 'en progreso' | 'completada';
  draft: boolean;
  createdBy: string;       // tutor/professional id
  createdByName: string;
  createdByRole: 'tutor' | 'profesional';
  createdAt: number;
  updatedAt: number;
  assignedToIds: string[]; // varios usuarios
  dueDate?: string;        // YYYY-MM-DD
  notes?: string;          // nota interna del creador
}

const KEY = 'tandem:custom-activities:v1';

function load(): CustomActivity[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return [];
}

function save(list: CustomActivity[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* noop */ }
}

interface Ctx {
  items: CustomActivity[];
  createOrUpdate: (
    data: Omit<CustomActivity, 'id' | 'isCustom' | 'createdBy' | 'createdByName' | 'createdByRole' | 'createdAt' | 'updatedAt' | 'status' | 'progress' | 'recommendedBy'> & { id?: string },
  ) => CustomActivity | null;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  publish: (id: string) => void;
  unpublish: (id: string) => void;
  byCreator: (creatorId: string) => CustomActivity[];
  forUser: (userId: string) => CustomActivity[];
}

const CustomActivitiesContext = createContext<Ctx | null>(null);

export function CustomActivitiesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CustomActivity[]>(() => load());

  useEffect(() => { save(items); }, [items]);

  const createOrUpdate: Ctx['createOrUpdate'] = useCallback((data) => {
    if (!user || (user.role !== 'tutor' && user.role !== 'professional' && user.role !== 'admin')) return null;
    const now = Date.now();
    let saved: CustomActivity | null = null;

    setItems(prev => {
      if (data.id) {
        const idx = prev.findIndex(a => a.id === data.id);
        if (idx >= 0) {
          const updated: CustomActivity = {
            ...prev[idx],
            ...data,
            id: prev[idx].id,
            updatedAt: now,
            isCustom: true,
          } as CustomActivity;
          saved = updated;
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
      }
      const id = `ca-${now}-${Math.random().toString(36).slice(2, 7)}`;
      const created: CustomActivity = {
        ...data,
        id,
        isCustom: true,
        status: 'pendiente',
        progress: 0,
        recommendedBy: user.role === 'tutor' ? 'tutor' : 'profesional',
        recommendedByName: user.name,
        createdBy: user.id,
        createdByName: user.name,
        createdByRole: user.role === 'tutor' ? 'tutor' : 'profesional',
        createdAt: now,
        updatedAt: now,
      } as CustomActivity;
      saved = created;
      return [created, ...prev];
    });

    return saved;
  }, [user]);

  const remove = useCallback((id: string) => setItems(prev => prev.filter(a => a.id !== id)), []);

  const duplicate = useCallback((id: string) => {
    setItems(prev => {
      const orig = prev.find(a => a.id === id);
      if (!orig) return prev;
      const copy: CustomActivity = {
        ...orig,
        id: `ca-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: `${orig.title} (copia)`,
        draft: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      return [copy, ...prev];
    });
  }, []);

  const publish = useCallback((id: string) =>
    setItems(prev => prev.map(a => a.id === id ? { ...a, draft: false, updatedAt: Date.now() } : a)), []);
  const unpublish = useCallback((id: string) =>
    setItems(prev => prev.map(a => a.id === id ? { ...a, draft: true, updatedAt: Date.now() } : a)), []);

  const byCreator = useCallback((creatorId: string) => items.filter(a => a.createdBy === creatorId), [items]);
  const forUser = useCallback((userId: string) =>
    items.filter(a => !a.draft && (a.assignedToIds?.includes(userId) || a.assignedTo === userId)), [items]);

  return (
    <CustomActivitiesContext.Provider value={{ items, createOrUpdate, remove, duplicate, publish, unpublish, byCreator, forUser }}>
      {children}
    </CustomActivitiesContext.Provider>
  );
}

export function useCustomActivities() {
  const ctx = useContext(CustomActivitiesContext);
  if (!ctx) throw new Error('useCustomActivities must be inside CustomActivitiesProvider');
  return ctx;
}

// Re-export tipos relevantes
export type { ActivityCategory, ActivityType };
