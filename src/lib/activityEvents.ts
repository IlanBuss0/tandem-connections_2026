export const ACTIVITY_STATUS_CHANGED_EVENT = 'tandem:activity-status-changed';

export function notifyActivityStatusChanged(activityId: string | number) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ACTIVITY_STATUS_CHANGED_EVENT, {
    detail: { activityId: String(activityId) },
  }));
}
