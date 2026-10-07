import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Notificacion } from '@/types/database';
import { tandemApi } from '@/services/api/tandem-api';
import { fetchMyNotifications, type Notification } from '@/data/api';
import { getNotificationDestination } from '@/pages/user/UserNotifications';

// Las notificaciones de ayuda desde rutinas y "No puedo hablar" no tienen reference_id.
const row = (referenceId: number | null) => ({
  id: 5, id_usuario_destino: 20, id_usuario_actor: 7, id_tipo_notificacion: 1,
  titulo: 'Juan pidió ayuda', cuerpo: 'Lo pidió desde «No puedo hablar».', leida: false,
  fecha_creacion: '2026-10-06T10:00:00Z', fecha_lectura: null,
  reference_type: 'activity_help:ayuda', reference_id: referenceId, context_user_id: 7,
}) as unknown as Notificacion;

describe('notificaciones de ayuda sin reference_id', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('se leen sin referenceId y su destino no se rompe', async () => {
    vi.spyOn(tandemApi.notificaciones, 'getMine').mockResolvedValue([row(null), row(12)]);
    const [withoutReference, withReference] = await fetchMyNotifications('20');
    expect(withoutReference.referenceType).toBe('activity_help:ayuda');
    expect(withoutReference.referenceId).toBeUndefined();
    expect(withoutReference.sourceUserId).toBe('7');
    expect(withReference.referenceId).toBe('12');

    expect(getNotificationDestination(withoutReference)).toEqual({ tab: 'home', params: { sourceUserId: '7' } });
    expect(getNotificationDestination(withReference)).toEqual({ tab: 'home', params: { sourceUserId: '7' } });
    expect(getNotificationDestination({ ...withoutReference, referenceId: null } as unknown as Notification)).toEqual({ tab: 'home', params: { sourceUserId: '7' } });
  });
});
