import type { GeneratedReport, TutorHomeLinkedUser } from '@/data/api';
import { reportMoment } from '@/lib/reportPeriod';
import { MONTH_NAMES, shortDate } from '@/lib/professionalReports';
import { pdfDate } from '@/lib/reportsPdf';

const sentAt = (report: GeneratedReport) => report.fecha_envio || report.fecha_generacion;

/** Reportes de una persona (id_perteneciente), del más nuevo al más viejo. */
export const reportsOfPerson = (reports: GeneratedReport[], personId: number) =>
  reports.filter(report => report.id_perteneciente === personId).sort((a, b) => reportMoment(b) - reportMoment(a));

/** "6 reportes · último el 28 sept" / "Todavía no hay reportes". Recibe la lista ya ordenada del más nuevo al más viejo. */
export function reportsSummary(sorted: GeneratedReport[]) {
  if (!sorted.length) return 'Todavía no hay reportes';
  return `${sorted.length} ${sorted.length === 1 ? 'reporte' : 'reportes'} · último el ${shortDate(sentAt(sorted[0]))}`;
}

/** Agrupa por mes de envío manteniendo el orden recibido: "Septiembre 2026". */
export function groupReportsByMonth(sorted: GeneratedReport[]) {
  const groups: { label: string; reports: GeneratedReport[] }[] = [];
  sorted.forEach(report => {
    const date = new Date(sentAt(report));
    const label = Number.isNaN(date.getTime()) ? 'Sin fecha' : `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
    const group = groups.find(entry => entry.label === label);
    if (group) group.reports.push(report); else groups.push({ label, reports: [report] });
  });
  return groups;
}

export const professionalNames = (reports: GeneratedReport[]) =>
  [...new Set(reports.map(report => report.profesional_nombre).filter((name): name is string => Boolean(name)))];

/** Línea de fecha del PDF del tutor: "28 sep 2026 · Lic. Laura Gómez". */
export const tutorByline = (report: GeneratedReport) => `${pdfDate(sentAt(report))} · ${report.profesional_nombre || 'Profesional'}`;

/** Persona cuyos reportes se ven: la elegida; si no, la primera con reportes; si no hay ninguna, la primera vinculada. */
export function resolveReportsPerson(linkedUsers: TutorHomeLinkedUser[], reports: GeneratedReport[], personId?: number) {
  return linkedUsers.find(user => user.pertenecienteId === personId)
    ?? linkedUsers.find(user => reports.some(report => report.id_perteneciente === user.pertenecienteId))
    ?? linkedUsers[0];
}
