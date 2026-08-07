import { describe, expect, it } from 'vitest';
import { buildTutorHomeViewModel, tutorRelativeTime } from './tutorHomeModel';

describe('tutor home model', () => {
  it('derives progress, emotions and upcoming items without UI concerns', () => {
    const owner = { id: 'u1', name: 'Juan Pérez', avatar: null, supportLevel: 'medio', autonomy: 'media', linkStatus: 'activo' };
    const activities = [
      { id: 'a1', title: 'Uno', completed: true, status: 'completada', assignedAt: '2026-08-06', owner },
      { id: 'a2', title: 'Dos', completed: false, status: 'pendiente', assignedAt: '2026-08-06', owner },
    ];
    const emotions = [{ id: 'e1', emotion: 'Feliz', intensity: 4, date: '2026-08-06', owner }];
    const data = { linkedUsers: [owner], byUserId: { u1: { activities, emotions, events: [], locations: [] } } };
    const model = buildTutorHomeViewModel(data as never, [owner] as never, activities as never, emotions as never, [], new Date('2026-08-07T12:00:00').getTime());
    expect(model.adherence).toBe(50);
    expect(model.memberProgress[0]).toMatchObject({ done: 1, total: 2, percentage: 50 });
    expect(model.emotionPercentages.high).toBe(100);
    expect(model.recentItems).toHaveLength(3);
  });

  it('formats relative time deterministically', () => {
    expect(tutorRelativeTime('2026-08-07T11:30:00', new Date('2026-08-07T12:00:00').getTime())).toBe('Hace 30 min');
  });
});
