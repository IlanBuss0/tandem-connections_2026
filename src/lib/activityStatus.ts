export function normalizeActivityStatus(value?: string | null): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, ' ');
}

export function isCompletedActivityStatus(value?: string | null): boolean {
  const status = normalizeActivityStatus(value);
  return [
    'complet',
    'finaliz',
    'realizad',
    'terminad',
    'finished',
    'completed',
    'done',
  ].some(marker => status.includes(marker));
}

export function isPendingActivity(activity: {
  status?: string | null;
  completed?: boolean;
}): boolean {
  if (activity.completed || isCompletedActivityStatus(activity.status)) return false;

  const status = normalizeActivityStatus(activity.status);
  return ['pendiente', 'pending', 'por hacer', 'todo'].includes(status);
}
