import { describe, expect, it } from 'vitest';
import { activityDisplayDescription } from './activityDescription';

describe('activityDisplayDescription', () => {
  it('oculta objetivo, pasos y JSON del juego guardados en líneas separadas', () => {
    expect(activityDisplayDescription([
      'Mirá el pictograma y armá la palabra arrastrando cada letra a su lugar.',
      'Objetivo: Construir la palabra arrastrando letras',
      'Pasos: Arrastrar letras para formar la palabra',
      'Juego: {"gameType":"drag-word","gameData":{"dragRounds":[]}}',
    ].join('\n'))).toBe('Mirá el pictograma y armá la palabra arrastrando cada letra a su lugar.');
  });

  it('limpia actividades antiguas que tienen los metadatos en una sola línea', () => {
    expect(activityDisplayDescription(
      'Descripción común. Objetivo: Practicar Pasos: Completar Juego: {"gameType":"drag-word"}',
    )).toBe('Descripción común.');
  });

  it('conserva una descripción común sin metadatos', () => {
    expect(activityDisplayDescription('Preparar la merienda siguiendo los apoyos visuales.'))
      .toBe('Preparar la merienda siguiendo los apoyos visuales.');
  });
});
