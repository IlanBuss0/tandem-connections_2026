import type { CalendarEvent, TutorHomeLinkedUser } from '@/data/api';
import { eventDotClass } from '@/lib/sessionStatus';

export type TutorItemKind = 'mine' | 'forPerson' | 'personAgenda' | 'personActivity';

/** Un color por persona vinculada (orden de linkedUsers). El azul queda para «Tu agenda». */
export const PERSON_DOTS = ['bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500'];

/** De quién es el evento: del tutor (con o sin persona) o de la persona (agenda propia o actividad asignada). */
export function tutorItemKind(event: Pick<CalendarEvent, 'id' | 'userId'>, userId: string, owner?: TutorHomeLinkedUser): TutorItemKind {
  if (String(event.userId) === String(userId)) return owner ? 'forPerson' : 'mine';
  return event.id.startsWith('asignada-') ? 'personActivity' : 'personAgenda';
}

export const personIndex = (owner: TutorHomeLinkedUser | undefined, linkedUsers: TutorHomeLinkedUser[]) =>
  owner ? linkedUsers.findIndex(user => user.id === owner.id) : -1;

export const personDotAt = (index: number) => PERSON_DOTS[index % PERSON_DOTS.length];

/** Color del punto: azul sin persona, color de la persona según su orden en linkedUsers. */
export function personDot(owner: TutorHomeLinkedUser | undefined, linkedUsers: TutorHomeLinkedUser[]) {
  const index = personIndex(owner, linkedUsers);
  return index < 0 ? eventDotClass : personDotAt(index);
}
