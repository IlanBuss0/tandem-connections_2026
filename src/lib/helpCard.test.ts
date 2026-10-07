import { describe, expect, it } from 'vitest';
import { formatPhone, helpCardTokenFromPath, whatsappUrl } from './helpCard';

describe('formatPhone', () => {
  it('da formato a 10 dígitos y deja el resto tal cual', () => {
    expect(formatPhone('1155551234')).toBe('11 5555-1234');
    expect(formatPhone('3515551234')).toBe('351 555-1234');
    expect(formatPhone('5491155551234')).toBe('5491155551234');
  });
});

describe('whatsappUrl', () => {
  it('antepone 549 a los celulares de 10 dígitos', () => {
    expect(whatsappUrl('1155551234')).toBe('https://wa.me/5491155551234');
    expect(whatsappUrl('5491155551234')).toBe('https://wa.me/5491155551234');
  });
});

describe('helpCardTokenFromPath', () => {
  it('lee el token de /tarjeta/:token y nada más', () => {
    const token = 'a'.repeat(64);
    expect(helpCardTokenFromPath(`/tarjeta/${token}`)).toBe(token);
    expect(helpCardTokenFromPath(`/tarjeta/${token}/`)).toBe(token);
    expect(helpCardTokenFromPath('/tarjeta')).toBeNull();
    expect(helpCardTokenFromPath(`/vincular/${token}`)).toBeNull();
    expect(helpCardTokenFromPath(`/tarjeta/${token}/otra`)).toBeNull();
  });
});
