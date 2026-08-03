import { describe, expect, it } from 'vitest';
import { sortByAutonomyUsage } from './autonomyCardOrder';

const CARDS = [
  { id: 'necesito-ayuda', label: 'Necesito ayuda' },
  { id: 'explicame-mas-lento', label: 'Explicame más lento' },
  { id: 'necesito-un-momento', label: 'Necesito un momento' },
] as const;

describe('sortByAutonomyUsage', () => {
  it('sin datos de uso, mantiene el orden original', () => {
    expect(sortByAutonomyUsage(CARDS, [], 'tarjeta_autonomia')).toEqual([...CARDS]);
  });

  it('ordena de mas a menos usado', () => {
    const usage = [
      { entidadTipo: 'tarjeta_autonomia', entidadId: 'necesito-un-momento', label: 'x', count: 10 },
      { entidadTipo: 'tarjeta_autonomia', entidadId: 'necesito-ayuda', label: 'x', count: 5 },
    ];
    const result = sortByAutonomyUsage(CARDS, usage, 'tarjeta_autonomia');
    expect(result.map((c) => c.id)).toEqual(['necesito-un-momento', 'necesito-ayuda', 'explicame-mas-lento']);
  });

  it('ignora entradas de un entidadTipo distinto (no mezcla tarjetas con modo crisis)', () => {
    const usage = [{ entidadTipo: 'modo_no_puedo_hablar', entidadId: 'necesito-ayuda', label: 'x', count: 10 }];
    expect(sortByAutonomyUsage(CARDS, usage, 'tarjeta_autonomia')).toEqual([...CARDS]);
  });

  it('mantiene el orden original entre las que empatan (sort estable)', () => {
    const usage = [{ entidadTipo: 'tarjeta_autonomia', entidadId: 'necesito-un-momento', label: 'x', count: 3 }];
    const result = sortByAutonomyUsage(CARDS, usage, 'tarjeta_autonomia');
    // necesito-un-momento pasa al frente; las otras dos, sin datos, quedan en su orden relativo
    expect(result.map((c) => c.id)).toEqual(['necesito-un-momento', 'necesito-ayuda', 'explicame-mas-lento']);
  });

  it('no muta el array original', () => {
    const usage = [{ entidadTipo: 'tarjeta_autonomia', entidadId: 'necesito-un-momento', label: 'x', count: 3 }];
    sortByAutonomyUsage(CARDS, usage, 'tarjeta_autonomia');
    expect(CARDS.map((c) => c.id)).toEqual(['necesito-ayuda', 'explicame-mas-lento', 'necesito-un-momento']);
  });
});
