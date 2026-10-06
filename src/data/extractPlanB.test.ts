import { describe, expect, it } from 'vitest';
import { extractPlanB } from './api';

describe('extractPlanB', () => {
  it('lee la línea PlanB entre las otras líneas de metadatos', () => {
    expect(extractPlanB('Desc\nObjetivo: X\nPasos: a | b\nPlanB: Usar una carpeta con hojas.\nJuego: {}'))
      .toBe('Usar una carpeta con hojas.');
  });

  it('devuelve undefined si no hay PlanB, está vacío o no hay descripción', () => {
    expect(extractPlanB('Desc\nObjetivo: X\nPasos: a | b')).toBeUndefined();
    expect(extractPlanB('PlanB:   ')).toBeUndefined();
    expect(extractPlanB(null)).toBeUndefined();
    expect(extractPlanB(undefined)).toBeUndefined();
  });
});
