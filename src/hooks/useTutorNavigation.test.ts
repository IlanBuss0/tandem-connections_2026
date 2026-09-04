import { describe, expect, it } from 'vitest';
import { tutorLocationFromPath, tutorPathFor } from './useTutorNavigation';

describe('tutor navigation routes', () => {
  it('maps primary Tutor screens to stable URLs', () => {
    expect(tutorPathFor('home')).toBe('/tutor');
    expect(tutorPathFor('calendar')).toBe('/tutor/calendario');
    expect(tutorLocationFromPath('/tutor/actividades').tab).toBe('activities');
  });

  it('preserves belonging context only in contextual routes', () => {
    expect(tutorPathFor('detail', { detailUserId: 'persona 7' })).toBe('/tutor/personas/persona%207');
    expect(tutorLocationFromPath('/tutor/personas/persona%207')).toEqual({ tab: 'detail', detailUserId: 'persona 7' });
  });

  it('opens a specific chat without creating global belonging context', () => {
    expect(tutorPathFor('chat', { chatId: '42' })).toBe('/tutor/chats/42');
    expect(tutorLocationFromPath('/tutor/chats/42')).toEqual({ tab: 'chat', detailUserId: null, chatId: '42' });
  });
});
