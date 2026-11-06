import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest } from '@/services/api/client';
import { tandemApi } from '@/services/api/tandem-api';
import { loadDailyActivity } from './dailyActivity';
import type { ConfiguracionUsuario } from '@/types/database';
import type { PertenecienteHomeActivity } from './api';

vi.mock('@/services/api/client', async importOriginal => ({ ...await importOriginal<typeof import('@/services/api/client')>(), apiRequest: vi.fn() }));
vi.mock('@/services/api/tandem-api', () => ({ tandemApi: { configuracionesUsuarios: { create: vi.fn(), update: vi.fn() } } }));
const records = new Map<string, ConfiguracionUsuario>();
const activities: PertenecienteHomeActivity[] = ['1', '2', '3'].map(id => ({ id, title: `Actividad ${id}`, description: '', status: 'pendiente', completed: false, assignedAt: '' }));

beforeEach(() => {
  records.clear();
  vi.resetAllMocks();
  vi.mocked(apiRequest).mockImplementation(async (path, options) => {
    expect(options?.cache).toBe('no-store');
    const [, userId, key] = path.match(/usuario\/([^/]+)\/(.+)$/)!;
    const record = records.get(`${userId}:${decodeURIComponent(key)}`);
    if (!record) throw new ApiError('No encontrada', 404);
    return record;
  });
  vi.mocked(tandemApi.configuracionesUsuarios.create).mockImplementation(async payload => {
    const record = { ...payload, id: records.size + 1 } as ConfiguracionUsuario;
    records.set(`${record.id_usuario}:${record.clave}`, record);
    return { id: record.id };
  });
  vi.mocked(tandemApi.configuracionesUsuarios.update).mockImplementation(async (id, payload) => {
    records.set(`${payload.id_usuario}:${payload.clave}`, { ...payload, id: Number(id) } as ConfiguracionUsuario);
    return { rowsAffected: 1 };
  });
});

describe('Actividad diaria persistida', () => {
  it('conserva la selección al recargar, reordenar datos o abandonar el juego', async () => {
    const first = await loadDailyActivity('1', '2026-12-31', activities, ['1', '2']);
    expect(first).toMatchObject({ status: 'pending', activity: { id: '3' } });
    expect(await loadDailyActivity('1', '2026-12-31', [...activities].reverse(), ['3'])).toEqual(first);
    expect(tandemApi.configuracionesUsuarios.create).toHaveBeenCalledTimes(1);
  });

  it('solo felicita por la actividad elegida y conserva el objetivo completado al recargar', async () => {
    await loadDailyActivity('1', '2026-12-31', activities);
    const otherCompleted = activities.map(item => item.id === '2' ? { ...item, completed: true } : item);
    expect(await loadDailyActivity('1', '2026-12-31', otherCompleted)).toMatchObject({ status: 'pending', activity: { id: '1' } });
    const completed = activities.map(item => item.id === '1' ? { ...item, completed: true } : item);
    expect(await loadDailyActivity('1', '2026-12-31', completed)).toMatchObject({ status: 'completed', activity: { id: '1' } });
    expect(await loadDailyActivity('1', '2026-12-31', structuredClone(completed))).toMatchObject({ status: 'completed' });
    expect(tandemApi.configuracionesUsuarios.create).toHaveBeenCalledTimes(1);
  });

  it('al día siguiente selecciona otra pendiente sin borrar la selección anterior', async () => {
    await loadDailyActivity('1', '2026-12-31', activities);
    expect(await loadDailyActivity('1', '2027-01-01', activities)).toMatchObject({ status: 'pending', activity: { id: '2' } });
    expect(records.size).toBe(2);
  });

  it('reemplaza una actividad que dejó de estar disponible sin mostrar enlaces rotos', async () => {
    await loadDailyActivity('1', '2026-12-31', activities);
    expect(await loadDailyActivity('1', '2026-12-31', activities.slice(1))).toMatchObject({ status: 'pending', activity: { id: '2' } });
    expect(tandemApi.configuracionesUsuarios.update).toHaveBeenCalledOnce();
  });

  it('no selecciona actividades completadas cuando no quedan pendientes', async () => {
    expect(await loadDailyActivity('1', '2026-12-31', activities.map(item => ({ ...item, completed: true })))).toEqual({ status: 'empty' });
    expect(tandemApi.configuracionesUsuarios.create).not.toHaveBeenCalled();
  });

  it('aísla las selecciones entre dos usuarios y las recupera al volver a entrar', async () => {
    await loadDailyActivity('1', '2026-12-31', activities, ['1']);
    await loadDailyActivity('2', '2026-12-31', activities, ['2']);
    expect(await loadDailyActivity('1', '2026-12-31', activities)).toMatchObject({ activity: { id: '2' } });
    expect(await loadDailyActivity('2', '2026-12-31', activities)).toMatchObject({ activity: { id: '1' } });
    expect(records.size).toBe(2);
  });

  it('no inventa éxito ni selección persistida cuando fallan las consultas o el guardado', async () => {
    vi.mocked(apiRequest).mockRejectedValueOnce(new ApiError('Sin conexión', 0));
    await expect(loadDailyActivity('1', '2026-12-31', activities)).rejects.toThrow('Sin conexión');
    vi.mocked(tandemApi.configuracionesUsuarios.create).mockRejectedValueOnce(new Error('Error al guardar'));
    await expect(loadDailyActivity('1', '2026-12-31', activities)).rejects.toThrow('Error al guardar');
    expect(records.size).toBe(0);
  });

  it('recupera una selección creada por otra pestaña ante un conflicto', async () => {
    vi.mocked(tandemApi.configuracionesUsuarios.create).mockImplementationOnce(async payload => {
      const record = { ...payload, id: 1, valor: JSON.stringify({ activityId: '3' }) } as ConfiguracionUsuario;
      records.set(`1:${record.clave}`, record);
      throw new ApiError('Ya existe', 400);
    });
    expect(await loadDailyActivity('1', '2026-12-31', activities)).toMatchObject({ status: 'pending', activity: { id: '3' } });
  });
});
