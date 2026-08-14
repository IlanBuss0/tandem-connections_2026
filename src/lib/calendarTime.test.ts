import { describe, expect, it } from 'vitest';
import { normalizeCalendarTime } from './calendarTime';

describe('normalizeCalendarTime', () => {
  it.each([
    ['9', '0', '09:00'],
    ['09', '30', '09:30'],
    ['23', '59', '23:59'],
    ['00', '00', '00:00'],
  ])('normaliza %s:%s como %s', (hour, minute, expected) => {
    expect(normalizeCalendarTime(hour, minute)).toBe(expected);
  });

  it.each([
    ['24', '00'],
    ['12', '60'],
    ['', '30'],
    ['ab', '30'],
  ])('rechaza el horario inválido %s:%s', (hour, minute) => {
    expect(normalizeCalendarTime(hour, minute)).toBeNull();
  });
});
