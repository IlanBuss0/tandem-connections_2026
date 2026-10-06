import { describe, expect, it } from 'vitest';
import type { Notification } from '@/data/api';
import { getNotificationDestination } from '@/pages/user/UserNotifications';

describe('getNotificationDestination', () => {
  it('un reporte profesional lleva a la pestaña de reportes con el id del reporte', () => {
    const notification = { type: 'system', referenceType: 'reporte_profesional', referenceId: '12' } as Notification;
    expect(getNotificationDestination(notification)).toEqual({ tab: 'reports', params: { reportId: '12' } });
  });
  it('los otros tipos siguen igual', () => {
    expect(getNotificationDestination({ type: 'chat', referenceType: 'chat', referenceId: '3' } as Notification)).toEqual({ tab: 'chat', params: { chatId: '3' } });
  });
});
