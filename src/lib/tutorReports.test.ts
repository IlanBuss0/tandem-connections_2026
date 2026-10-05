import { describe, expect, it } from 'vitest';
import type { GeneratedReport, TutorHomeLinkedUser } from '@/data/api';
import { groupReportsByMonth, professionalNames, reportsOfPerson, reportsSummary, resolveReportsPerson, tutorByline } from '@/lib/tutorReports';

const make = (id: number, person: number, sent: string, pro = 'Lic. Ana') =>
  ({ id, id_perteneciente: person, fecha_envio: sent, fecha_generacion: sent, profesional_nombre: pro }) as GeneratedReport;
const reports = [make(1, 7, '2026-08-31T10:00:00'), make(2, 7, '2026-09-28T10:00:00'), make(3, 7, '2026-09-14T10:00:00', 'Lic. Pablo'), make(4, 8, '2026-09-01T10:00:00')];
const users = [{ id: 'u1', pertenecienteId: 5 }, { id: 'u2', pertenecienteId: 7 }, { id: 'u3', pertenecienteId: 8 }] as unknown as TutorHomeLinkedUser[];

describe('tutorReports', () => {
  it('filtra por persona, del más nuevo al más viejo', () => {
    expect(reportsOfPerson(reports, 7).map(r => r.id)).toEqual([2, 3, 1]);
  });
  it('resume cantidad y último', () => {
    expect(reportsSummary([])).toBe('Todavía no hay reportes');
    expect(reportsSummary(reportsOfPerson(reports, 8))).toMatch(/^1 reporte · último el 1 sep/);
    expect(reportsSummary(reportsOfPerson(reports, 7))).toMatch(/^3 reportes · último el 28 sep/);
  });
  it('agrupa por mes manteniendo el orden', () => {
    const groups = groupReportsByMonth(reportsOfPerson(reports, 7));
    expect(groups.map(g => [g.label, g.reports.length])).toEqual([['Septiembre 2026', 2], ['Agosto 2026', 1]]);
  });
  it('profesionales sin repetir y byline', () => {
    expect(professionalNames(reports)).toEqual(['Lic. Ana', 'Lic. Pablo']);
    expect(tutorByline(reports[0])).toMatch(/2026 · Lic\. Ana$/);
  });
  it('elige la persona: pedida, primera con reportes o primera vinculada', () => {
    expect(resolveReportsPerson(users, reports, 8)?.id).toBe('u3');
    expect(resolveReportsPerson(users, reports)?.id).toBe('u2');
    expect(resolveReportsPerson(users, reports, 99)?.id).toBe('u2');
    expect(resolveReportsPerson(users, [])?.id).toBe('u1');
  });
});
