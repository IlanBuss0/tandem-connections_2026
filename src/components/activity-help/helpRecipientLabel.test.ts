import { describe, expect, it } from 'vitest';
import { helpRecipientLabel } from './helpRecipientLabel';

describe('helpRecipientLabel', () => {
  it('devuelve el primer nombre, salteando títulos que terminan en punto', () => {
    expect(helpRecipientLabel('Lic. Martina Pérez', 'tutor')).toBe('Martina');
    expect(helpRecipientLabel('Dra. Ana', 'tutor')).toBe('Ana');
    expect(helpRecipientLabel('Prof. Dr. Juan Gómez', 'tutor')).toBe('Juan');
  });

  it('un nombre sin título queda igual que antes', () => {
    expect(helpRecipientLabel('Laura Gómez', 'tutor')).toBe('Laura');
    expect(helpRecipientLabel('  Laura  ', 'tutor')).toBe('Laura');
    expect(helpRecipientLabel('J. Pérez', 'tutor')).toBe('J.');
  });

  it('sin nombre usable, o sin rol de tutor, dice "quien te acompaña"', () => {
    expect(helpRecipientLabel('', 'tutor')).toBe('quien te acompaña');
    expect(helpRecipientLabel(undefined, 'tutor')).toBe('quien te acompaña');
    expect(helpRecipientLabel('Lic.', 'tutor')).toBe('quien te acompaña');
    expect(helpRecipientLabel('Laura Gómez', 'profesional')).toBe('quien te acompaña');
  });
});
