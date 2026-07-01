import { describe, expect, it } from 'vitest';
import { normalizeRound, normalizeWheel, parseWheel, selectedWheelSegment, serializeWheel, wheelMotion, wheelScore, wheelSegmentAngles, wheelValidationError } from './wheelPrecision';

describe('wheel precision data', () => {
  it('round-trips settings and rounds', () => {
    const wheel = { settings: { segments: 4, initialSpeed: 5, speedIncrease: false }, rounds: [{ targetWord: 'PERA', image: 'a', options: ['a', 'b', 'c', 'd'], correct: 0 }] };
    expect(parseWheel(serializeWheel(wheel))).toEqual(wheel);
  });

  it('clamps settings and synchronizes the correct image', () => {
    const round = normalizeRound({ targetWord: 'UVA', image: 'correcta', options: ['a'], correct: 9 }, 20);
    expect(round.options).toHaveLength(8);
    expect(round.correct).toBe(7);
    expect(round.options[7]).toBe('correcta');
  });

  it('converts legacy words into playable rounds', () => {
    const wheel = normalizeWheel({ words: ['Hola', 'Chau', 'Gracias', 'Por favor'] });
    expect(wheel.settings.segments).toBe(4);
    expect(wheel.rounds).toHaveLength(4);
    expect(wheel.rounds[2].options[wheel.rounds[2].correct]).toBe('Gracias');
  });

  it('reports incomplete rounds', () => {
    expect(wheelValidationError({ settings: { segments: 4, initialSpeed: 3, speedIncrease: true }, rounds: [{ targetWord: 'PERA', image: '', options: ['', '', '', ''], correct: 0 }] })).toContain('Completá');
  });
});

describe('wheel precision mechanics', () => {
  it('uses a slow perceptual speed scale for levels 1 through 5', () => {
    const speeds = [1, 2, 3, 4, 5].map(level => wheelMotion(level).targetSpeed * 1000);
    expect(speeds).toEqual([18, 42, 84, 150, 240]);
    expect(speeds.every((speed, index) => index === 0 || speed > speeds[index - 1])).toBe(true);
  });

  it('applies round increases consistently to speed, acceleration and deceleration', () => {
    const base = wheelMotion(2, 0, true);
    const later = wheelMotion(2, 2, true);
    expect(later.targetSpeed).toBeCloseTo(base.targetSpeed * 1.24);
    expect(later.accelerationMs).toBeCloseTo(base.accelerationMs / 1.24);
    expect(later.decelerationMs).toBeCloseTo(base.decelerationMs * 1.24);
    expect(wheelMotion(2, 3, false)).toEqual(base);
  });

  it('selects the segment centered under the top indicator', () => {
    for (const segments of [4, 6, 8]) {
      for (let index = 0; index < segments; index += 1) {
        const { center } = wheelSegmentAngles(index, segments);
        expect(selectedWheelSegment(-center, segments)).toBe(index);
        expect(selectedWheelSegment(720 - center, segments)).toBe(index);
      }
    }
  });

  it('uses the same half-slice boundaries as the SVG geometry', () => {
    const epsilon = 0.001;
    const { start, end } = wheelSegmentAngles(2, 6);
    expect(selectedWheelSegment(-(start + epsilon), 6)).toBe(2);
    expect(selectedWheelSegment(-(end - epsilon), 6)).toBe(2);
    expect(selectedWheelSegment(-(end + epsilon), 6)).toBe(3);
  });

  it('scores each round as 100 divided by attempts', () => {
    expect(wheelScore([1, 2, 4])).toBe(58);
    expect(wheelScore([1, 1, 1])).toBe(100);
  });
});
