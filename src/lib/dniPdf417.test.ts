import { describe, expect, it } from 'vitest';
import { describePdf417, isPlausibleDniPdf417 } from './dniPdf417';

const MODERN = '00612345678@PEREZ GOMEZ@JUAN CARLOS@M@30123456@A@01/01/1990@15/05/2015@239';

describe('dniPdf417', () => {
  it('acepta el formato moderno, con separador final y con caracteres de control', () => {
    expect(isPlausibleDniPdf417(MODERN)).toBe(true);
    expect(isPlausibleDniPdf417(`${MODERN}@`)).toBe(true);
    expect(isPlausibleDniPdf417(`\u0000${MODERN}\r\n`)).toBe(true);
  });

  it('acepta el formato legado de 16 campos', () => {
    const fields = Array.from({ length: 16 }, () => '');
    fields[1] = '30123456';
    expect(isPlausibleDniPdf417(fields.join('@'))).toBe(true);
  });

  it('rechaza lecturas corruptas o ajenas', () => {
    expect(isPlausibleDniPdf417('hola mundo')).toBe(false);
    expect(isPlausibleDniPdf417(MODERN.replace('30123456', '3012X456'))).toBe(false);
    expect(isPlausibleDniPdf417('a@b@c')).toBe(false);
  });

  it('describe la lectura sin exponer datos personales', () => {
    const info = describePdf417(MODERN);
    expect(info.fieldCount).toBe(9);
    expect(info.shape).not.toMatch(/PEREZ|JUAN|30123456/);
    expect(info.shape).toContain('9{8}');
  });
});
