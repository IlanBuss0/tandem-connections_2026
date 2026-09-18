import type { GeneratedReport } from '@/data/api';

export function reportTime(report: GeneratedReport) {
  const value = report.fecha_envio || report.fecha_generacion;
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? time : 0;
}

export function reportDate(report: GeneratedReport) {
  return new Date(report.fecha_envio || report.fecha_generacion);
}

export function monthKey(report: GeneratedReport) {
  const date = reportDate(report);
  return Number.isNaN(date.getTime()) ? 'Sin fecha' : date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}
