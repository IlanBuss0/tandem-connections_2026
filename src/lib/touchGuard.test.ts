import { describe, expect, it } from 'vitest';
import { shouldAcceptTouch, ACCIDENTAL_TOUCH_MIN_INTERVAL_MS } from './touchGuard';

describe('shouldAcceptTouch', () => {
  it('acepta el primer toque siempre (no hay toque previo)', () => {
    expect(shouldAcceptTouch(null, 1000)).toBe(true);
  });

  it('rechaza un segundo toque que llega demasiado rapido', () => {
    expect(shouldAcceptTouch(1000, 1000 + ACCIDENTAL_TOUCH_MIN_INTERVAL_MS - 1)).toBe(false);
  });

  it('acepta un segundo toque que llega despues del intervalo minimo', () => {
    expect(shouldAcceptTouch(1000, 1000 + ACCIDENTAL_TOUCH_MIN_INTERVAL_MS)).toBe(true);
  });

  it('respeta un intervalo minimo custom', () => {
    expect(shouldAcceptTouch(1000, 1200, 100)).toBe(true);
    expect(shouldAcceptTouch(1000, 1050, 100)).toBe(false);
  });
});
