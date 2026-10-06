import type { GeneratedReport } from "@/data/api";
import { saveBlob } from "@/lib/downloadBlob";

// Única responsabilidad: dibujar reportes ya elegidos en UN solo PDF (jsPDF).
// Regla: cada reporte empieza en una página nueva, salvo que dos reportes cortos
// entren juntos en la misma hoja (máximo 2 por hoja). Cada uno lleva título y fecha.
const M = 18; // margen mm
const BODY = 10.5;
const LINE = 5.2;
const GAP = 12; // separación entre dos reportes en la misma hoja

export type ReportsPdfInput = {
  heading: string; // "Reportes de Martina"
  periodLabel: string; // "Del 1 sep 2025 al 1 oct 2026"
  reports: GeneratedReport[]; // ya filtrados y ordenados
  byline: (report: GeneratedReport) => string; // "28 sep 2026 · Lic. Laura Gómez"
};

export async function buildReportsPdf({ heading, periodLabel, reports, byline }: ReportsPdfInput): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const width = W - M * 2;
  const bottom = H - M - 8;
  let y = M;

  const lines = (text: string, size: number, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    return doc.splitTextToSize(text, width) as string[];
  };
  const measure = (report: GeneratedReport) =>
    lines(report.titulo || "Reporte de seguimiento", 13, true).length * 6.2 + 6.5 + lines(report.contenido || "", BODY).length * LINE;

  // Encabezado del archivo (solo primera hoja)
  doc.setTextColor(43, 33, 69);
  lines(heading, 16, true).forEach((l) => { doc.text(l, M, y + 5); y += 7; });
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(103, 94, 120);
  doc.text(`${periodLabel} · ${reports.length} ${reports.length === 1 ? "reporte" : "reportes"}`, M, y + 3);
  y += 9;
  doc.setDrawColor(230, 220, 245); doc.line(M, y, W - M, y); y += 8;

  let onPage = 0; // reportes ya dibujados en la hoja actual
  reports.forEach((report, index) => {
    const height = measure(report);
    const half = (bottom - M) / 2;
    if (index > 0) {
      const fitsHere = onPage === 1 && height <= half && y + GAP + height <= bottom;
      if (fitsHere) {
        y += GAP / 2; doc.setDrawColor(230, 220, 245); doc.line(M, y, W - M, y); y += GAP / 2;
      } else {
        doc.addPage(); y = M; onPage = 0;
      }
    }
    // Título
    doc.setTextColor(43, 33, 69);
    lines(report.titulo || "Reporte de seguimiento", 13, true).forEach((l) => { doc.text(l, M, y + 5); y += 6.2; });
    // Fecha · autor
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(103, 94, 120);
    doc.text(byline(report), M, y + 3.5); y += 6.5;
    // Texto (puede seguir en la hoja siguiente si es largo)
    doc.setTextColor(43, 33, 69);
    lines(report.contenido || "", BODY).forEach((l) => {
      if (y + LINE > bottom) { doc.addPage(); y = M; }
      doc.setFont("helvetica", "normal"); doc.setFontSize(BODY);
      doc.text(l, M, y + 4); y += LINE;
    });
    onPage = height <= half ? onPage + 1 : 2; // un reporte largo ocupa la hoja
  });

  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(139, 122, 160);
    doc.text(`TÁNDEM · ${heading}`, M, H - M + 4);
    doc.text(`Página ${page} de ${total}`, W - M, H - M + 4, { align: "right" });
  }
  return doc.output("blob");
}

const slug = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "persona";

/** Nombre del archivo, sin acentos ni espacios. */
export function reportsPdfFilename(personName: string, dates: { from: string; to: string } | null, single?: GeneratedReport) {
  const name = slug(personName);
  if (single) return `reporte-${name}-${(single.fecha_envio || single.fecha_generacion || "").slice(0, 10)}.pdf`;
  return dates ? `reportes-${name}-${dates.from}_${dates.to}.pdf` : `reportes-${name}-todos.pdf`;
}

/** "28 sep 2026". */
export const pdfDate = (value: string | null | undefined) => {
  const date = new Date(value || "");
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" }).replace(/[.,]/g, "");
};

/** Un solo reporte: misma función que el PDF de varios, con 1 elemento. */
export async function buildSingleReportPdf(report: GeneratedReport, personName: string, byline: ReportsPdfInput["byline"]) {
  return buildReportsPdf({ heading: `Reporte de ${personName}`, periodLabel: pdfDate(report.fecha_envio || report.fecha_generacion), reports: [report], byline });
}

/** Arma y descarga el PDF de un solo reporte. */
export async function downloadSingleReport(report: GeneratedReport, personName: string, byline: ReportsPdfInput["byline"]) {
  saveBlob(await buildSingleReportPdf(report, personName, byline), reportsPdfFilename(personName, null, report));
}
