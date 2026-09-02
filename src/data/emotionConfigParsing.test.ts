import { describe, expect, it } from 'vitest';
import { parseEmotionConfig, parsePersonalNoteConfig } from './api';

const baseConfig = {
  id: 7,
  id_usuario: 11,
  clave: 'emotion:test',
  valor: '',
  fecha_modificacion: '2026-08-10T12:30:00.000Z',
};

describe('emotion configuration parsing', () => {
  it('rejects records whose emotion cannot be rendered by React', () => {
    expect(parseEmotionConfig({
      ...baseConfig,
      valor: JSON.stringify({ emotion: { label: 'Contento' }, emoji: '😊' }),
    })).toBeNull();
  });

  it('normalizes optional fields with invalid persisted types', () => {
    expect(parseEmotionConfig({
      ...baseConfig,
      valor: JSON.stringify({
        emotion: ' Contento ',
        emoji: { value: '😊' },
        intensity: 99,
        context: { text: 'Escuela' },
        whatHelped: null,
        date: { iso: '2026-08-10' },
        timestamp: 1230,
      }),
    })).toMatchObject({
      emotion: 'Contento',
      emoji: '🙂',
      intensity: 5,
      context: '',
      whatHelped: '',
      date: '2026-08-10',
    });
  });
});

describe('personal note configuration parsing', () => {
  it('rejects a note whose content is not text', () => {
    expect(parsePersonalNoteConfig({
      ...baseConfig,
      clave: 'personal-note:test',
      valor: JSON.stringify({ content: { text: 'nota' } }),
    })).toBeNull();
  });
});
