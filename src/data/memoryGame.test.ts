import { describe, expect, it } from 'vitest';
import { DEFAULT_MEMORY_SETTINGS, memoryScore, memoryValidationError, normalizeMemory } from './memoryGame';

const pairs = Array.from({ length: 4 }, (_, index) => ({ a: `imagen-${index}`, b: `palabra-${index}` }));

describe('memory game data', () => {
  it('adds accessible defaults to legacy activities', () => {
    expect(normalizeMemory({ pairs })).toEqual({ pairs, settings: DEFAULT_MEMORY_SETTINGS });
  });

  it('clamps configurable durations', () => {
    const memory = normalizeMemory({ pairs, settings: { previewEnabled: true, previewSeconds: 99, timed: true, timeLimitSeconds: 5 } });
    expect(memory.settings.previewSeconds).toBe(8);
    expect(memory.settings.timeLimitSeconds).toBe(30);
  });

  it('validates pair limits, empty sides and ambiguous duplicates', () => {
    expect(memoryValidationError({ pairs: pairs.slice(0, 3) })).toContain('entre 4 y 8');
    expect(memoryValidationError({ pairs: [...pairs.slice(0, 3), { a: '', b: 'final' }] })).toContain('dos lados');
    expect(memoryValidationError({ pairs: [...pairs.slice(0, 3), { a: 'imagen-0', b: 'final' }] })).toContain('diferente');
    expect(memoryValidationError({ pairs })).toBeNull();
  });

  it('scores efficiency with a floor', () => {
    expect(memoryScore(4, 4)).toBe(100);
    expect(memoryScore(4, 8)).toBe(50);
    expect(memoryScore(4, 100)).toBe(40);
  });
});
