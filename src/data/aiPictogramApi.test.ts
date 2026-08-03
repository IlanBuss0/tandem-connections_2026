import { describe, expect, it } from 'vitest';
import { buildGeneratedPictogram } from './aiPictogramApi';

describe('buildGeneratedPictogram', () => {
  it('arma un Pictogram valido a partir de una generacion guardada', () => {
    const picto = buildGeneratedPictogram('abc-123', 'Lavarse los dientes', 'https://example.com/preview.png');
    expect(picto).toEqual({
      id: 'abc-123',
      name: 'Lavarse los dientes',
      emoji: '📷',
      imageUrl: 'https://example.com/preview.png',
      category: 'otros',
      tags: [],
    });
  });
});
