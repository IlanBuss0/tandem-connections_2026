import { describe, expect, it } from 'vitest';
import { sortWordsByUsage } from './nucleoWordOrder';

const WORDS = [
  { word: 'yo', pictogram: null },
  { word: 'vos', pictogram: null },
  { word: 'el', pictogram: null },
];

describe('sortWordsByUsage', () => {
  it('sin informe de vocabulario, mantiene el orden original', () => {
    expect(sortWordsByUsage(WORDS, null)).toEqual(WORDS);
  });

  it('sin palabras usadas, mantiene el orden original', () => {
    const report = { used: [], neverUsed: ['yo', 'vos', 'el'], totalUtterances: 0 };
    expect(sortWordsByUsage(WORDS, report)).toEqual(WORDS);
  });

  it('ordena de mas a menos usado', () => {
    const report = { used: [{ word: 'el', count: 5 }, { word: 'yo', count: 2 }], neverUsed: ['vos'], totalUtterances: 7 };
    const result = sortWordsByUsage(WORDS, report);
    expect(result.map((w) => w.word)).toEqual(['el', 'yo', 'vos']);
  });

  it('no muta el array original', () => {
    const report = { used: [{ word: 'el', count: 5 }], neverUsed: [], totalUtterances: 5 };
    sortWordsByUsage(WORDS, report);
    expect(WORDS.map((w) => w.word)).toEqual(['yo', 'vos', 'el']);
  });
});
