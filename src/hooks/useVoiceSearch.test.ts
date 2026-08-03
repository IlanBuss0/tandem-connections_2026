import { afterEach, describe, expect, it } from 'vitest';
import { isVoiceSearchSupported } from './useVoiceSearch';

afterEach(() => {
  // @ts-expect-error - limpiar el global de prueba
  delete window.SpeechRecognition;
  // @ts-expect-error - idem
  delete window.webkitSpeechRecognition;
});

describe('isVoiceSearchSupported', () => {
  it('es false si el navegador no expone SpeechRecognition', () => {
    expect(isVoiceSearchSupported()).toBe(false);
  });

  it('es true si expone SpeechRecognition', () => {
    // @ts-expect-error - stub minimo para la prueba
    window.SpeechRecognition = function () {};
    expect(isVoiceSearchSupported()).toBe(true);
  });

  it('es true si solo expone el prefijo webkit (Chrome)', () => {
    // @ts-expect-error - stub minimo para la prueba
    window.webkitSpeechRecognition = function () {};
    expect(isVoiceSearchSupported()).toBe(true);
  });
});
