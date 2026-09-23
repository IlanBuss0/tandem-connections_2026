import { describe, expect, it } from 'vitest';
import { generateEvolutionSummaryPdf } from './evolutionSummaryPdf';
import type { EvolutionSummaryExport } from '@/components/perteneciente/evolution/buildEvolutionExport';

const baseData: EvolutionSummaryExport = {
  personName: 'Juan Pérez',
  generatedAt: new Date('2026-09-15T10:00:00Z'),
  changes: { phrase: 'Vemos avances y un área que pide un poco más de apoyo.', cards: [{ title: 'Autonomía cotidiana', before: 'Antes: 8', after: '14 pasos por semana', direction: 1 }] },
  weekly: { rows: [{ week: 'Semana del 18 ago', steps: '6', mood: '48%' }] },
  vocabulary: { totalUtterances: 128, used: [{ word: 'quiero', count: 34 }], neverUsed: ['ayuda', 'no'] },
  patterns: { lines: ['Cuando hay eventos de mañana, suele registrarse una emoción difícil (65% de 12 veces).'], anticipation: 'Cuando vio antes la historia social, su ánimo fue más positivo.' },
  failedSections: [],
};

describe('generateEvolutionSummaryPdf', () => {
  it('con datos completos, genera un blob PDF no vacío', async () => {
    const blob = await generateEvolutionSummaryPdf(baseData);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe('application/pdf');
  });

  it('con secciones en null, no revienta', async () => {
    const blob = await generateEvolutionSummaryPdf({ ...baseData, weekly: null, vocabulary: null, patterns: null });
    expect(blob.size).toBeGreaterThan(0);
  });

  it('con failedSections, igual genera el PDF (no falla en silencio)', async () => {
    const blob = await generateEvolutionSummaryPdf({ ...baseData, vocabulary: null, patterns: null, failedSections: ['Informe de vocabulario', 'Patrones detectados'] });
    expect(blob.size).toBeGreaterThan(0);
  });

  it('con semanas vacías, no revienta', async () => {
    const blob = await generateEvolutionSummaryPdf({ ...baseData, weekly: { rows: [] } });
    expect(blob.size).toBeGreaterThan(0);
  });
});
