import { describe, expect, it } from 'vitest';
import { ACTIVITY_GAME_TYPES, emptyGameData, gameTypeOrder, isGameTypeAvailable } from './activityGameTypes';

describe('activity game type catalog', () => {
  it('prioritizes the five manually developed game types', () => {
    expect(ACTIVITY_GAME_TYPES.slice(0, 5).map(option => option.type)).toEqual([
      'multiple-choice', 'drag-word', 'wheel', 'memory', 'routine-sequence',
    ]);
    expect(ACTIVITY_GAME_TYPES.slice(0, 5).every(option => option.available)).toBe(true);
    expect(ACTIVITY_GAME_TYPES.slice(5).every(option => !option.available)).toBe(true);
  });

  it('orders available templates before future types', () => {
    expect(gameTypeOrder('multiple-choice')).toBeLessThan(gameTypeOrder('routine-sequence'));
    expect(isGameTypeAvailable('tap-correct')).toBe(false);
  });

  it('creates empty editable content instead of copying a precreated activity', () => {
    expect(emptyGameData('multiple-choice').rounds?.[0].image).toBe('');
    expect(emptyGameData('drag-word').dragRounds?.[0].correct).toBe('');
    expect(emptyGameData('memory').memory?.pairs).toEqual([]);
    expect(emptyGameData('routine-sequence').routineSequence?.cards).toEqual([]);
  });
});
