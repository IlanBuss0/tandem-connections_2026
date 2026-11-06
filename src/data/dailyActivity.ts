import { addDays } from 'date-fns';
import type { PertenecienteHomeActivity } from './api';
import type { ConfiguracionUsuario } from '@/types/database';
import { apiRequest, ApiError } from '@/services/api/client';
import { tandemApi } from '@/services/api/tandem-api';
import { isCompletedActivityStatus, isPendingActivity } from '@/lib/activityStatus';
import { localDateKey } from '@/lib/routineDay';

export type DailyActivity =
  | { status: 'pending' | 'completed'; activity: PertenecienteHomeActivity }
  | { status: 'empty' };

const configKey = (day: string) => `activities.daily:${day}`;

async function readSelection(userId: string, day: string): Promise<ConfiguracionUsuario | undefined> {
  try {
    return await apiRequest<ConfiguracionUsuario>(
      `/api/configuraciones-usuarios/usuario/${encodeURIComponent(userId)}/${encodeURIComponent(configKey(day))}`,
      { cache: 'no-store' },
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}

function selectedId(config?: ConfiguracionUsuario): string | undefined {
  try {
    const value: unknown = JSON.parse(config?.valor || 'null');
    return value && typeof value === 'object' && 'activityId' in value && typeof value.activityId === 'string'
      ? value.activityId : undefined;
  } catch { return undefined; }
}

function resolveSelection(activities: PertenecienteHomeActivity[], config?: ConfiguracionUsuario): DailyActivity | undefined {
  const id = selectedId(config);
  const activity = activities.find(item => item.id === id);
  if (!activity) return undefined;
  if (activity.completed || isCompletedActivityStatus(activity.status)) return { status: 'completed', activity };
  if (isPendingActivity(activity)) return { status: 'pending', activity };
  return undefined;
}

/** Guarda solo la selección; el éxito siempre se comprueba con las actividades consultadas al servidor. */
export async function loadDailyActivity(userId: string, day: string, activities: PertenecienteHomeActivity[], excludedIds: string[] = []): Promise<DailyActivity> {
  const config = await readSelection(userId, day);
  const selected = resolveSelection(activities, config);
  if (selected) return selected;

  const pending = activities.filter(isPendingActivity).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  if (!pending.length) return { status: 'empty' };
  const yesterday = localDateKey(addDays(new Date(`${day}T12:00:00`), -1));
  const previousId = selectedId(await readSelection(userId, yesterday));
  const alternatives = pending.filter(item => item.id !== previousId);
  const candidates = alternatives.length ? alternatives : pending;
  const activity = candidates.find(item => !excludedIds.includes(item.id)) || candidates[0];
  const payload = {
    id_usuario: Number(userId),
    clave: configKey(day),
    valor: JSON.stringify({ activityId: activity.id }),
    fecha_modificacion: new Date().toISOString(),
  };
  if (config) {
    await tandemApi.configuracionesUsuarios.update(config.id, payload);
  } else {
    try {
      await tandemApi.configuracionesUsuarios.create(payload);
    } catch (error) {
      // Otra pestaña/dispositivo pudo crear la selección, o perderse la respuesta del POST.
      const saved = resolveSelection(activities, await readSelection(userId, day));
      if (saved) return saved;
      throw error;
    }
  }
  return { status: 'pending', activity };
}
