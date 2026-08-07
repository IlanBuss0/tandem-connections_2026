import { describe, expect, it } from 'vitest';
import { encodePatientLink } from '@/components/PersonalEventCalendar';
import { aggregateTutorEvents } from '@/lib/tutorEventAggregation';
import type { CalendarEvent, TutorHomeData, TutorHomeLinkedUser } from '@/data/api';

const linked = { id: '21', name: 'Mateo Prueba' } as TutorHomeLinkedUser;
const emptyBucket: TutorHomeData['byUserId'][string] = { activities: [], emotions: [], events: [], locations: [], notifications: [], recommendations: [] };

describe('aggregateTutorEvents', () => {
  it('incluye un evento futuro creado por el tutor y conserva la persona asociada', () => {
    const futureEvent = {
      id: 'future-1', userId: '10', title: 'Reunión futura', date: '2035-06-18', time: '11:00',
      type: 'personal', color: '#7c3aed', description: encodePatientLink('Seguimiento', linked.id),
    } as CalendarEvent;

    const result = aggregateTutorEvents([linked], { [linked.id]: emptyBucket }, [futureEvent]);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Reunión futura');
    expect(result[0].description).toBe('Seguimiento');
    expect(result[0].owner?.id).toBe(linked.id);
  });

  it('mezcla y ordena eventos de vinculados y del tutor por fecha futura', () => {
    const linkedEvent = { id: 'linked-1', userId: linked.id, title: 'Segundo', date: '2035-06-20', time: '09:00', description: '', type: 'personal', color: '#7c3aed' } as CalendarEvent;
    const tutorEvent = { id: 'tutor-1', userId: '10', title: 'Primero', date: '2035-06-19', time: '09:00', description: '', type: 'personal', color: '#7c3aed' } as CalendarEvent;
    const result = aggregateTutorEvents([linked], { [linked.id]: { ...emptyBucket, events: [linkedEvent] } }, [tutorEvent]);
    expect(result.map(event => event.title)).toEqual(['Primero', 'Segundo']);
  });
});
