import { afterEach, describe, expect, it, vi } from 'vitest';
import { completeAssignedActivity, fetchPertenecienteHome } from '@/data/api';
import { activities } from '@/data/mockData';
import { ACTIVITY_STATUS_CHANGED_EVENT } from './activityEvents';
import { isPendingActivity } from './activityStatus';

const activity = activities.find(item => item.id === 'a2')!;
const original = { status: activity.status, progress: activity.progress };

afterEach(() => {
  activity.status = original.status;
  activity.progress = original.progress;
});

describe('Próximas acciones completion flow', () => {
  it('removes an activity after completion and announces the refresh', async () => {
    const statusChanged = vi.fn();
    window.addEventListener(ACTIVITY_STATUS_CHANGED_EVENT, statusChanged, { once: true });

    const before = await fetchPertenecienteHome('u1');
    expect(before.activities.filter(isPendingActivity).some(item => item.id === activity.id)).toBe(true);

    await completeAssignedActivity(activity, 'u1');

    const after = await fetchPertenecienteHome('u1');
    expect(after.activities.filter(isPendingActivity).some(item => item.id === activity.id)).toBe(false);
    expect(statusChanged).toHaveBeenCalledOnce();
  });
});
