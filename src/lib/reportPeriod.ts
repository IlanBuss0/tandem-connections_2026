import type { GeneratedReport } from "@/data/api";

export type ReportPeriod = "all" | "year" | "month" | "week" | "custom";
export const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "year", label: "Último año" },
  { value: "month", label: "Último mes" },
  { value: "week", label: "Última semana" },
  { value: "custom", label: "Elegir fechas" },
];
const DAYS: Record<"year" | "month" | "week", number> = { year: 365, month: 30, week: 7 };
const DAY_MS = 86_400_000;

/** Fecha que manda para filtrar y ordenar: envío si existe, si no generación. */
export const reportMoment = (report: GeneratedReport) => Date.parse(report.fecha_envio || report.fecha_generacion || "") || 0;

/** Reportes de una persona dentro del período, del más viejo al más nuevo (orden de lectura del PDF). */
export function reportsInPeriod(reports: GeneratedReport[], personId: number, period: ReportPeriod, range: { from: string; to: string }, now = Date.now()) {
  let from = -Infinity;
  let to = Infinity;
  if (period === "custom") {
    from = range.from ? Date.parse(`${range.from}T00:00:00`) : -Infinity;
    to = range.to ? Date.parse(`${range.to}T23:59:59`) : Infinity;
  } else if (period !== "all") {
    from = now - DAYS[period] * DAY_MS;
  }
  return reports
    .filter((report) => report.id_perteneciente === personId)
    .filter((report) => { const t = reportMoment(report); return t >= from && t <= to; })
    .sort((a, b) => reportMoment(a) - reportMoment(b));
}

const pad = (n: number) => String(n).padStart(2, "0");
const dateKey = (ms: number) => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

/** Desde/hasta (YYYY-MM-DD) del período, o null si es «Todos» o el rango personalizado está incompleto. */
export function periodDates(period: ReportPeriod, range: { from: string; to: string }, now = Date.now()) {
  if (period === "custom") return range.from && range.to ? { from: range.from, to: range.to } : null;
  if (period === "all") return null;
  return { from: dateKey(now - DAYS[period] * DAY_MS), to: dateKey(now) };
}
