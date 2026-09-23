import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchVocabularyReport: vi.fn(),
  fetchPatternsReport: vi.fn(),
}));

vi.mock('@/data/usageApi', async importOriginal => ({
  ...(await importOriginal<typeof import('@/data/usageApi')>()),
  fetchVocabularyReport: mocks.fetchVocabularyReport,
  fetchPatternsReport: mocks.fetchPatternsReport,
}));

const { buildEvolutionExport } = await import('./buildEvolutionExport');

const baseOptions = {
  userId: 'u1',
  personName: 'Juan Pérez',
  changes: { phrase: 'Vemos avances.', cards: [{ title: 'Autonomía cotidiana', before: 'Antes: 8', after: '14 pasos por semana', direction: 1 as const }] },
  weeks: [
    { week: '2026-W29', routineCompletions: 6, positiveEmotionRatio: 0.48, emotionSampleSize: 5 },
    { week: '2026-W30', routineCompletions: 14, positiveEmotionRatio: null, emotionSampleSize: 0 },
  ],
};

describe('buildEvolutionExport', () => {
  it('con todas las secciones tildadas, pide vocabulario y patrones y arma cambios/semanas', async () => {
    mocks.fetchVocabularyReport.mockResolvedValue({ used: [{ word: 'quiero', count: 34 }], neverUsed: ['ayuda'], totalUtterances: 128 });
    mocks.fetchPatternsReport.mockResolvedValue({ eventTypePatterns: [{ type: 'mañana', negativeRatio: 0.65, sampleSize: 12 }], anticipationSupport: { viewedPositiveRatio: 0.71, notViewedPositiveRatio: 0.42, difference: 0.29, helps: true } });

    const result = await buildEvolutionExport({ ...baseOptions, sections: { changes: true, weekly: true, vocabulary: true, patterns: true } });

    expect(result.changes?.cards).toHaveLength(1);
    expect(result.weekly?.rows).toEqual([
      { week: 'Semana del 13 jul', steps: '6', mood: '48%' },
      { week: 'Semana del 20 jul', steps: '14', mood: '—' },
    ]);
    expect(result.vocabulary).toEqual({ totalUtterances: 128, used: [{ word: 'quiero', count: 34 }], neverUsed: ['ayuda'] });
    expect(result.patterns?.lines[0]).toContain('mañana');
    expect(result.patterns?.anticipation).toContain('más positivo');
    expect(result.failedSections).toEqual([]);
  });

  it('con secciones destildadas, no pide vocabulario ni patrones y deja esas partes en null', async () => {
    mocks.fetchVocabularyReport.mockClear();
    mocks.fetchPatternsReport.mockClear();

    const result = await buildEvolutionExport({ ...baseOptions, sections: { changes: true, weekly: false, vocabulary: false, patterns: false } });

    expect(mocks.fetchVocabularyReport).not.toHaveBeenCalled();
    expect(mocks.fetchPatternsReport).not.toHaveBeenCalled();
    expect(result.weekly).toBeNull();
    expect(result.vocabulary).toBeNull();
    expect(result.patterns).toBeNull();
    expect(result.changes).not.toBeNull();
  });

  it('si un fetch falla (devuelve null), la sección va a failedSections en vez de romper', async () => {
    mocks.fetchVocabularyReport.mockResolvedValue(null);
    mocks.fetchPatternsReport.mockResolvedValue(null);

    const result = await buildEvolutionExport({ ...baseOptions, sections: { changes: false, weekly: false, vocabulary: true, patterns: true } });

    expect(result.vocabulary).toBeNull();
    expect(result.patterns).toBeNull();
    expect(result.failedSections).toEqual(['Informe de vocabulario', 'Patrones detectados']);
  });
});
