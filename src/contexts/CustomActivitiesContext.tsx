import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { completeAssignedActivity, type Activity, type ActivityCategory, type ActivityType } from '@/data/api';
import { tandemApi } from '@/services/api';

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
  backendId?: number;
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

const typeIdByActivityType: Record<ActivityType, number> = {
  guiada: 5,
  juego: 7,
  regulación: 11,
  decisión: 7,
};

function pointIdFromPoints(points: number) {
  if (points >= 100) return 3;
  if (points >= 50) return 2;
  return 1;
}

async function resolvePertenecienteIds(userIds: string[]) {
  if (userIds.length === 0) return [];
  const numericUserIds = new Set(userIds.map(Number).filter(Number.isFinite));
  const pertenecientes = await tandemApi.pertenecientes.getAll();
  return pertenecientes
    .filter((item) => numericUserIds.has(Number(item.id_usuario)))
    .map((item) => Number(item.id));
}

async function assignBackendActivity(backendId: number, assignedToIds: string[], assignerUserId: string) {
  const numericAssignerId = Number(assignerUserId);
  if (!Number.isFinite(numericAssignerId)) return;

  const [pertenecienteIds, currentAssignments] = await Promise.all([
    resolvePertenecienteIds(assignedToIds),
    tandemApi.actividadesAsignadas.getAll().catch(() => []),
  ]);

  await Promise.all(pertenecienteIds.map((idPerteneciente) => {
    const alreadyAssigned = currentAssignments.some((item) =>
      Number(item.id_actividad_personalizada) === Number(backendId) &&
      Number(item.id_perteneciente) === Number(idPerteneciente)
    );
    if (alreadyAssigned) return Promise.resolve(null);
    return tandemApi.actividadesAsignadas.create({
      id_actividad: null,
      id_actividad_personalizada: backendId,
      id_perteneciente: idPerteneciente,
      id_usuario_asignador: numericAssignerId,
      id_estado_actividad: 1,
      fecha_asignacion: new Date().toISOString(),
      fecha_completada: null,
    });
  }));
}

interface Ctx {
  items: CustomActivity[];
  createOrUpdate: (
    data: Omit<CustomActivity, 'id' | 'isCustom' | 'createdBy' | 'createdByName' | 'createdByRole' | 'createdAt' | 'updatedAt' | 'status' | 'progress' | 'recommendedBy'> & { id?: string },
  ) => Promise<CustomActivity | null>;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  publish: (id: string) => void;
  unpublish: (id: string) => void;
  complete: (id: string, userId: string) => Promise<void>;
  byCreator: (creatorId: string) => CustomActivity[];
  forUser: (userId: string) => CustomActivity[];
}

const CustomActivitiesContext = createContext<Ctx | null>(null);

export function CustomActivitiesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CustomActivity[]>(() => load());

  useEffect(() => { save(items); }, [items]);

  const createOrUpdate: Ctx['createOrUpdate'] = useCallback(async (data) => {
    if (!user || (user.role !== 'tutor' && user.role !== 'professional' && user.role !== 'admin')) return null;
    const now = Date.now();
    const existing = data.id ? items.find(a => a.id === data.id) : undefined;
    const backendPayload = {
      id_actividad_base: null,
      id_tipo_actividad: typeIdByActivityType[data.type] || 5,
      id_punto_otorgado: pointIdFromPoints(Number(data.points || 0)),
      id_usuario_creador: Number(user.id),
      titulo: data.title.trim() || 'Actividad sin título',
      descripcion: [
        data.description?.trim(),
        data.objective?.trim() ? `Objetivo: ${data.objective.trim()}` : '',
        data.steps?.length ? `Pasos: ${data.steps.join(' | ')}` : '',
      ].filter(Boolean).join('\n'),
      fecha_creacion: existing?.createdAt ? new Date(existing.createdAt).toISOString() : new Date(now).toISOString(),
      activa: true,
    };

    let backendId = existing?.backendId;
    if (Number.isFinite(Number(user.id))) {
      if (backendId) {
        await tandemApi.actividadesPersonalizadas.update(backendId, backendPayload);
      } else {
        const created = await tandemApi.actividadesPersonalizadas.create(backendPayload);
        backendId = Number(created.id);
      }

      if (!data.draft && backendId) await assignBackendActivity(backendId, data.assignedToIds || [], user.id);
    }

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
            backendId,
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
        backendId,
      } as CustomActivity;
      saved = created;
      return [created, ...prev];
    });

    return saved;
  }, [items, user]);

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

  const publish = useCallback((id: string) => {
    const activity = items.find(a => a.id === id);
    if (activity?.backendId && user) {
      void assignBackendActivity(activity.backendId, activity.assignedToIds || [], user.id);
    }
    setItems(prev => prev.map(a => a.id === id ? { ...a, draft: false, updatedAt: Date.now() } : a));
  }, [items, user]);
  const unpublish = useCallback((id: string) =>
    setItems(prev => prev.map(a => a.id === id ? { ...a, draft: true, updatedAt: Date.now() } : a)), []);

  const complete: Ctx['complete'] = useCallback(async (id, userId) => {
    const activity = items.find(a => a.id === id);
    if (activity) {
      await completeAssignedActivity(activity, userId).catch(() => undefined);
    }
    setItems(prev => prev.map(a => a.id === id ? { ...a, status: 'completada', progress: 100, updatedAt: Date.now() } : a));
  }, [items]);

  const byCreator = useCallback((creatorId: string) => items.filter(a => a.createdBy === creatorId), [items]);
  const forUser = useCallback((userId: string) =>
    items.filter(a => !a.draft && (a.assignedToIds?.includes(userId) || a.assignedTo === userId)), [items]);

  return (
    <CustomActivitiesContext.Provider value={{ items, createOrUpdate, remove, duplicate, publish, unpublish, complete, byCreator, forUser }}>
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
