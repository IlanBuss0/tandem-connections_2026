import { describe, expect, it } from 'vitest';
import type { GeneratedReport } from '@/data/api';
import { buildReportsPdf, reportsPdfFilename } from '@/lib/reportsPdf';

const report = (id: number, words: number) =>
  ({ id, titulo: `Reporte ${id}`, contenido: Array(words).fill('palabra').join(' '), fecha_generacion: '2026-09-01T10:00:00', fecha_envio: null }) as GeneratedReport;
const pages = async (list: GeneratedReport[]) => {
  const blob = await buildReportsPdf({ heading: 'Reportes de Martina', periodLabel: 'Todos', reports: list, byline: () => 'fecha' });
  const text = await new Promise<string>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.readAsBinaryString(blob); });
  return (text.match(/\/Type\s*\/Page\b/g) || []).length;
};

describe('reportsPdfFilename', () => {
  it('sin acentos ni espacios', () => {
    expect(reportsPdfFilename('María Pérez', { from: '2026-09-01', to: '2026-09-30' })).toBe('reportes-maria-perez-2026-09-01_2026-09-30.pdf');
    expect(reportsPdfFilename('María Pérez', null)).toBe('reportes-maria-perez-todos.pdf');
    expect(reportsPdfFilename('María', null, report(1, 1))).toBe('reporte-maria-2026-09-01.pdf');
  });
});

describe('buildReportsPdf', () => {
  it('dos reportes cortos comparten hoja; uno largo sigue en la siguiente', async () => {
    expect(await pages([report(1, 30), report(2, 30)])).toBe(1);
    expect(await pages([report(1, 30), report(2, 30), report(3, 30)])).toBe(2);
    expect(await pages([report(1, 30), report(2, 900)])).toBeGreaterThanOrEqual(2);
  });
});
