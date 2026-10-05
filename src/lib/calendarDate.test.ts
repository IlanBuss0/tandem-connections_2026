import { describe, expect, it } from 'vitest';
import { datePartsToIso, isoToDateParts } from './calendarDate';

describe('manual calendar date', () => {
  it('keeps the Argentine DD/MM/YYYY order', () => {
    expect(isoToDateParts('2026-08-14')).toEqual({ day: '14', month: '08', year: '2026' });
    expect(datePartsToIso({ day: '14', month: '08', year: '2026' })).toBe('2026-08-14');
  });

  it.each([
    { day: '31', month: '02', year: '2026' },
    { day: '31', month: '04', year: '2026' },
    { day: '00', month: '08', year: '2026' },
    { day: '14', month: '13', year: '2026' },
    { day: '14', month: '08', year: '26' },
  ])('rejects impossible or incomplete date $day/$month/$year', parts => {
    expect(datePartsToIso(parts)).toBeNull();
  });

  it('accepts February 29 only on leap years', () => {
    expect(datePartsToIso({ day: '29', month: '02', year: '2024' })).toBe('2024-02-29');
    expect(datePartsToIso({ day: '29', month: '02', year: '2026' })).toBeNull();
  });
});
