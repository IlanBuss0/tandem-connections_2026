import type { CalendarEvent, TutorHomeData, TutorHomeLinkedUser } from '@/data/api';
import { decodePatientLink } from '@/components/PersonalEventCalendar';

export type TutorAggregateEvent = CalendarEvent & { owner?: TutorHomeLinkedUser };

export function aggregateTutorEvents(
  linkedUsers: TutorHomeLinkedUser[],
  byUserId: TutorHomeData['byUserId'],
  tutorEvents: CalendarEvent[],
): TutorAggregateEvent[] {
  const linkedByUserId = new Map(linkedUsers.map(owner => [String(owner.id), owner]));
  const events: TutorAggregateEvent[] = [];
  const seen = new Set<string>();

  const add = (event: CalendarEvent, owner?: TutorHomeLinkedUser) => {
    const key = `${event.id}:${event.userId}`;
    if (seen.has(key)) return;
    seen.add(key);
    events.push({ ...event, owner });
  };

  linkedUsers.forEach(owner => {
    byUserId[owner.id]?.events.forEach(event => add(event, owner));
  });

  tutorEvents.forEach(event => {
    const { patientId, cleanDescription } = decodePatientLink(event.description || '');
    add({ ...event, description: cleanDescription }, linkedByUserId.get(String(patientId)));
  });

  return events.sort((a, b) => {
    const first = Date.parse(`${a.date}T${a.time || '00:00'}`);
    const second = Date.parse(`${b.date}T${b.time || '00:00'}`);
    return first - second;
  });
}
