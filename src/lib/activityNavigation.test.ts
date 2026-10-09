import { describe, expect, it } from 'vitest';
import { deduplicateActivities, findActivityByNavigationId, moveSelectedActivityFirst } from './activityNavigation';

const activities = [
  { id: 'activity-a', assignedActivityId: 101, title: 'Actividad A' },
  { id: 'activity-b', assignedActivityId: 202, title: 'Actividad B' },
  { id: 'legacy-c', title: 'Actividad legacy' },
];

describe('activity navigation id', () => {
  it('opens the assignment selected in card A', () => {
    expect(findActivityByNavigationId(activities, '101')?.title).toBe('Actividad A');
  });

  it('opens the assignment selected in card B', () => {
    expect(findActivityByNavigationId(activities, '202')?.title).toBe('Actividad B');
  });

  it('supports the real activity id for legacy data', () => {
    expect(findActivityByNavigationId(activities, 'legacy-c')?.title).toBe('Actividad legacy');
  });

  it('fails safely when the activity is no longer available', () => {
    expect(findActivityByNavigationId(activities, 'missing')).toBeUndefined();
  });

  it('deduplicates a custom activity coming from context and backend assignment', () => {
    const backend = { id: 'assignment-7', assignedActivityId: 7, backendCustomActivityId: 42, title: 'Backend' };
    const context = { id: 'custom-local', backendId: 42, title: 'Context' };
    expect(deduplicateActivities([backend, context])).toEqual([backend]);
  });

  it('deduplicates repeated backend rows by their real assignment id', () => {
    const first = { id: '9', assignedActivityId: 9, title: 'First' };
    const repeated = { id: '9', title: 'Repeated' };
    expect(deduplicateActivities([first, repeated])).toEqual([first]);
  });

  it('moves the selected activity first without duplicating it', () => {
    const selected = activities[1];
    const reordered = moveSelectedActivityFirst(activities, selected);
    expect(reordered.map(item => item.title)).toEqual(['Actividad B', 'Actividad A', 'Actividad legacy']);
    expect(reordered.filter(item => item.id === selected.id)).toHaveLength(1);
  });
});
