import { describe, expect, it } from 'vitest';
import type { TutorHomeLinkedUser } from '@/data/api';
import { eventDotClass } from '@/lib/sessionStatus';
import { personDot, tutorItemKind } from '@/lib/tutorCalendarItems';

const users = Array.from({ length: 5 }, (_, i) => ({ id: String(i + 1), name: `P${i}` })) as TutorHomeLinkedUser[];

describe('tutorItemKind', () => {
  it('distingue eventos del tutor y de la persona', () => {
    expect(tutorItemKind({ id: '1', userId: '9' }, '9')).toBe('mine');
    expect(tutorItemKind({ id: '1', userId: '9' }, '9', users[0])).toBe('forPerson');
    expect(tutorItemKind({ id: 'asignada-3', userId: '1' }, '9', users[0])).toBe('personActivity');
    expect(tutorItemKind({ id: '7', userId: '1' }, '9', users[0])).toBe('personAgenda');
  });
});

describe('personDot', () => {
  it('azul sin persona, color por orden y se repite', () => {
    expect(personDot(undefined, users)).toBe(eventDotClass);
    expect(personDot(users[0], users)).toBe('bg-violet-500');
    expect(personDot(users[3], users)).toBe('bg-pink-500');
    expect(personDot(users[4], users)).toBe('bg-violet-500');
  });
});
