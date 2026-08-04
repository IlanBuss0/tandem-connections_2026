import { describe, expect, it } from 'vitest';
import { normalizeLegacySequence, routineScore, snapshotRoutine, validateRoutineSequence, type RoutineSequenceData } from './routineSequence';
import { GAME_TEMPLATES } from './miniGames';

const base: RoutineSequenceData = {
  schemaVersion: 1, mode: 'order', prompt: 'Ordená', supportLevel: 'initial', hintsEnabled: true,
  cards: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }, { id: 'c', text: 'C' }],
  stepIds: ['a','b','c'], acceptedOrders: [['a','b','c'], ['b','a','c']],
};

describe('routine-sequence model', () => {
  it('accepts multiple valid orders', () => expect(validateRoutineSequence(base)).toBeNull());
  it('rejects orders with missing references', () => expect(validateRoutineSequence({ ...base, acceptedOrders: [['a','b','x']] })).toMatch(/orden/i));
  it('normalizes legacy sequence-order without mutating it', () => {
    const legacy = { prompt: 'Ordená', steps: ['Uno','Dos','Tres'] };
    const normalized = normalizeLegacySequence(legacy)!;
    expect(normalized.mode).toBe('order');
    expect(normalized.stepIds).toEqual(['legacy-step-1','legacy-step-2','legacy-step-3']);
    expect(legacy.steps).toEqual(['Uno','Dos','Tres']);
  });
  it('calculates penalties with a floor of 40', () => {
    expect(routineScore(2, 1)).toBe(85);
    expect(routineScore(20, 4)).toBe(40);
  });
  it('ships five valid initial templates', () => {
    const templates = GAME_TEMPLATES.filter(template => template.gameType === 'routine-sequence');
    expect(templates).toHaveLength(5);
    expect(templates.map(template => validateRoutineSequence(template.gameData.routineSequence))).toEqual([null, null, null, null, null]);
  });
  it('copies a routine as an independent snapshot without schedules or completion state', () => {
    const routine = { id: 'routine-1', name: 'Mañana', items: [
      { title: 'Uno', icon: '1', time: '08:00', completed: true, reminders: [5] },
      { title: 'Dos', icon: '2', time: '08:10', completed: false },
      { title: 'Tres', icon: '3', time: '08:20', completed: true },
      { title: 'Cuatro', icon: '4', time: '08:30', completed: false },
    ] };
    const snapshot = snapshotRoutine(routine, '17', 1, 3);
    expect(snapshot.cards.map(card => card.text)).toEqual(['Dos','Tres','Cuatro']);
    expect(snapshot.cards[0]).not.toHaveProperty('time');
    expect(snapshot.cards[0]).not.toHaveProperty('completed');
    routine.items[1].title = 'Cambió';
    expect(snapshot.cards[0].text).toBe('Dos');
  });
});
