export function findActivityByNavigationId<
  T extends { id: string | number; assignedActivityId?: string | number },
>(activities: T[], navigationId?: string | number): T | undefined {
  if (navigationId === undefined || navigationId === null) return undefined;
  const expected = String(navigationId);
  return activities.find(activity => String(activity.assignedActivityId ?? activity.id) === expected);
}

type ActivityIdentity = {
  id: string | number;
  assignedActivityId?: string | number;
  backendCustomActivityId?: string | number | null;
  backendId?: string | number | null;
};

export function getActivityIdentity(activity: ActivityIdentity): string {
  const customBackendId = activity.backendCustomActivityId ?? activity.backendId;
  if (customBackendId !== undefined && customBackendId !== null) return `custom:${customBackendId}`;
  if (activity.assignedActivityId !== undefined && activity.assignedActivityId !== null) {
    return `assignment:${activity.assignedActivityId}`;
  }
  return `activity:${activity.id}`;
}

function getActivityIdentityKeys(activity: ActivityIdentity): string[] {
  const keys = [`id:${activity.id}`];
  if (activity.assignedActivityId !== undefined && activity.assignedActivityId !== null) {
    keys.push(`assignment:${activity.assignedActivityId}`, `id:${activity.assignedActivityId}`);
  }
  const customBackendId = activity.backendCustomActivityId ?? activity.backendId;
  if (customBackendId !== undefined && customBackendId !== null) keys.push(`custom:${customBackendId}`);
  return keys;
}

export function deduplicateActivities<T extends ActivityIdentity>(activities: T[]): T[] {
  const seen = new Set<string>();
  return activities.filter(activity => {
    const identities = getActivityIdentityKeys(activity);
    if (identities.some(identity => seen.has(identity))) return false;
    identities.forEach(identity => seen.add(identity));
    return true;
  });
}

export function moveSelectedActivityFirst<T extends ActivityIdentity>(activities: T[], selected?: T): T[] {
  if (!selected) return activities;
  const selectedIdentity = getActivityIdentity(selected);
  if (!activities.some(activity => getActivityIdentity(activity) === selectedIdentity)) return activities;
  return [selected, ...activities.filter(activity => getActivityIdentity(activity) !== selectedIdentity)];
}
