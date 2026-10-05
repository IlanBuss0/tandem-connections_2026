import type { GeneratedReport, ProfessionalSession } from "@/data/api";
import { pdfDate } from "@/lib/reportsPdf";

export type ReportFilter = "all" | "unsent" | "sent";
export type PatientFolder = { pertenecienteId: number; name: string; reports: GeneratedReport[]; unsent: number; last: GeneratedReport };

export const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const time = (value: string | null | undefined) => {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
};
const byGeneratedDesc = (a: GeneratedReport, b: GeneratedReport) => time(b.fecha_generacion) - time(a.fecha_generacion);

/** "28 sep". */
export const shortDate = (value: string | null | undefined) => {
  const date = new Date(value || "");
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("es-AR", { day: "numeric", month: "short" }).replace(".", "");
};

/** "lun 5 oct". */
export const weekdayDate = (value: string | null | undefined) => {
  const date = new Date(value || "");
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" }).replace(/[.,]/g, "");
};

/** Línea de fecha del PDF del profesional: "28 sep 2026 · Enviado". */
export const professionalByline = (report: GeneratedReport) =>
  `${pdfDate(report.fecha_envio || report.fecha_generacion)} · ${report.enviado_al_tutor ? "Enviado" : "Sin enviar"}`;

export const reportTitle = (report: GeneratedReport) => report.titulo?.trim() || "Reporte de seguimiento";

export const unsentReports = (reports: GeneratedReport[]) => reports.filter((report) => !report.enviado_al_tutor).sort(byGeneratedDesc);

export function groupByPatient(reports: GeneratedReport[], nameOf: (report: GeneratedReport) => string): PatientFolder[] {
  const map = new Map<number, GeneratedReport[]>();
  reports.forEach((report) => map.set(report.id_perteneciente, [...(map.get(report.id_perteneciente) || []), report]));
  return [...map.entries()]
    .map(([pertenecienteId, list]) => {
      const sorted = [...list].sort(byGeneratedDesc);
      return { pertenecienteId, name: nameOf(sorted[0]), reports: sorted, unsent: sorted.filter((report) => !report.enviado_al_tutor).length, last: sorted[0] };
    })
    .sort((a, b) => byGeneratedDesc(a.last, b.last));
}

export const filterReports = (reports: GeneratedReport[], filter: ReportFilter) =>
  filter === "all" ? reports : reports.filter((report) => report.enviado_al_tutor === (filter === "sent"));

/** Agrupa por mes de generación, del más reciente al más viejo. */
export function groupByMonth(reports: GeneratedReport[]) {
  const groups: { label: string; reports: GeneratedReport[] }[] = [];
  [...reports].sort(byGeneratedDesc).forEach((report) => {
    const date = new Date(report.fecha_generacion);
    const label = Number.isNaN(date.getTime()) ? "Sin fecha" : `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
    const group = groups.find((entry) => entry.label === label);
    if (group) group.reports.push(report);
    else groups.push({ label, reports: [report] });
  });
  return groups;
}

const MAX_RANGE_DAYS = 366;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Primer y último día del mes, como YYYY-MM-DD. */
export function monthRange(year: number, month: number) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return { desde: `${year}-${pad(month)}-01`, hasta: `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}` };
}

/** "01/09/2026 al 30/09/2026". */
export const rangeLabel = (desde: string, hasta: string) => `${desde.split("-").reverse().join("/")} al ${hasta.split("-").reverse().join("/")}`;

/** Mismas reglas que el backend: fechas completas, desde ≤ hasta y máximo 366 días. */
export function rangeError(desde: string, hasta: string) {
  if (!desde || !hasta) return "Elegí las dos fechas.";
  if (desde > hasta) return "«Desde» no puede ser posterior a «Hasta».";
  if ((Date.parse(hasta) - Date.parse(desde)) / DAY_MS + 1 > MAX_RANGE_DAYS) return "El período puede ser de hasta un año.";
  return null;
}

/** Conteos de «Tu PDF va a tener», con las sesiones ya cargadas. Los días se cuentan en UTC, igual que el backend. */
export function pdfPreview(sessions: ProfessionalSession[], scope: { pertenecienteIds: number[]; desde?: string; hasta?: string }) {
  const ids = new Set(scope.pertenecienteIds);
  const matching = sessions.filter((session) => {
    if (!ids.has(Number(session.id_perteneciente))) return false;
    const date = new Date(session.fecha_sesion);
    if (Number.isNaN(date.getTime())) return false;
    const day = date.toISOString().slice(0, 10);
    return (!scope.desde || day >= scope.desde) && (!scope.hasta || day <= scope.hasta);
  });
  return { patients: new Set(matching.map((session) => session.id_perteneciente)).size, sessions: matching.length };
}

/** Los últimos `count` reportes por fecha de generación. */
export const latestReports = (reports: GeneratedReport[], count: number) => [...reports].sort(byGeneratedDesc).slice(0, count);
