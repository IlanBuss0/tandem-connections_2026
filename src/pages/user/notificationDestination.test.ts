import { describe, expect, it } from 'vitest';
import type { Notification } from '@/data/api';
import { getNotificationDestination } from '@/pages/user/UserNotifications';

describe('getNotificationDestination', () => {
  it('un reporte profesional lleva a la pestaña de reportes con el id del reporte', () => {
    const notification = { type: 'system', referenceType: 'reporte_profesional', referenceId: '12' } as Notification;
    expect(getNotificationDestination(notification)).toEqual({ tab: 'reports', params: { reportId: '12' } });
  });
  it('el escaneo de la tarjeta de ayuda lleva al inicio con la persona, sin id de otra cosa', () => {
    const notification = { type: 'alert', referenceType: 'help_card_scan', referenceId: '5', sourceUserId: '9' } as Notification;
    expect(getNotificationDestination(notification)).toEqual({ tab: 'home', params: { sourceUserId: '9' } });
  });
  it('los otros tipos siguen igual', () => {
    expect(getNotificationDestination({ type: 'chat', referenceType: 'chat', referenceId: '3' } as Notification)).toEqual({ tab: 'chat', params: { chatId: '3' } });
  });
});
