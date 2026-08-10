import type { TutorAggregateEvent } from '@/lib/tutorEventAggregation';
import type { TutorHomeData, TutorHomeLinkedUser } from '@/data/api';

export type TutorAggregateActivity = TutorHomeData['byUserId'][string]['activities'][number] & { owner: TutorHomeLinkedUser };
export type TutorAggregateEmotion = TutorHomeData['byUserId'][string]['emotions'][number] & { owner: TutorHomeLinkedUser };

export function parseTutorDate(value?: string | null) {
  if (!value) return 0;
  const parsed = Date.parse(value.includes('T') ? value : `${value}T12:00:00`);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function tutorRelativeTime(value?: string | null, now = Date.now()) {
  const time = parseTutorDate(value);
  if (!time) return value || '';
  const minutes = Math.max(0, Math.floor((now - time) / 60000));
  if (minutes < 60) return `Hace ${Math.max(1, minutes)} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Ayer' : `Hace ${days} días`;
}

export function buildTutorHomeViewModel(
  data: TutorHomeData,
  linkedUsers: TutorHomeLinkedUser[],
  activities: TutorAggregateActivity[],
  emotions: TutorAggregateEmotion[],
  events: TutorAggregateEvent[],
  now = Date.now(),
) {
  const completed = activities.filter(item => item.completed).length;
  const adherence = activities.length ? Math.round((completed / activities.length) * 100) : 0;
  const recentEmotions = emotions.filter(item => parseTutorDate(item.date) >= now - 7 * 86400000);
  const emotionCounts = recentEmotions.reduce((result, item) => {
    if (item.intensity >= 4) result.high += 1;
    else if (item.intensity === 3) result.medium += 1;
    else result.low += 1;
    return result;
  }, { high: 0, medium: 0, low: 0 });
  const emotionTotal = recentEmotions.length;
  const emotionPercentages = {
    high: emotionTotal ? Math.round((emotionCounts.high / emotionTotal) * 100) : 0,
    medium: emotionTotal ? Math.round((emotionCounts.medium / emotionTotal) * 100) : 0,
    low: emotionTotal ? Math.round((emotionCounts.low / emotionTotal) * 100) : 0,
  };
  const memberProgress = linkedUsers.map(owner => {
    const memberActivities = data.byUserId[owner.id]?.activities || [];
    const done = memberActivities.filter(item => item.completed).length;
    return { owner, done, total: memberActivities.length, percentage: memberActivities.length ? Math.round((done / memberActivities.length) * 100) : 0 };
  });
  const upcomingEvents = events.filter(item => parseTutorDate(`${item.date}T${item.time || '00:00'}`) >= now - 3600000).slice(0, 5);
  const recentItems = [
    ...activities.slice(0, 6).map(item => ({ id: `a-${item.owner.id}-${item.id}`, type: 'activity' as const, completed: item.completed, label: item.completed ? 'Actividad completada' : 'Actividad asignada', detail: item.title, owner: item.owner, date: item.completedAt || item.assignedAt })),
    ...emotions.slice(0, 6).map(item => ({ id: `e-${item.owner.id}-${item.id}`, type: 'emotion' as const, completed: false, label: 'Emoción registrada', detail: item.emotion, owner: item.owner, date: item.date })),
  ].sort((a, b) => parseTutorDate(b.date) - parseTutorDate(a.date)).slice(0, 6);

  return { adherence, emotionTotal, emotionPercentages, memberProgress, upcomingEvents, recentItems };
}

export type TutorHomeViewModel = ReturnType<typeof buildTutorHomeViewModel>;
