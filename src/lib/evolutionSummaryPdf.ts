import type { EvolutionSummaryExport } from '@/components/perteneciente/evolution/buildEvolutionExport';
import { trendLabel } from '@/components/perteneciente/evolution/evolutionHelpers';

// Unica responsabilidad: dibujar un EvolutionSummaryExport ya armado como
// PDF con jsPDF (mismo patron que pictogramPdf.ts). No sabe nada de React
// ni hace requests — todo el dato ya le llega resuelto.
const MARGIN_MM = 15;
const FOOTER_TEXT = 'Generado por TÁNDEM a partir de los registros compartidos. No es un informe clínico ni reemplaza a un profesional de la salud.';

export async function generateEvolutionSummaryPdf(data: EvolutionSummaryExport): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN_MM * 2;
  let y = MARGIN_MM;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - MARGIN_MM - 10) { doc.addPage(); y = MARGIN_MM; }
  };

  const writeLine = (text: string, { size = 10, bold = false, gap = 5 }: { size?: number; bold?: boolean; gap?: number } = {}) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const lines: string[] = doc.splitTextToSize(text, contentWidth);
    ensureSpace(lines.length * gap);
    doc.text(lines, MARGIN_MM, y);
    y += lines.length * gap;
  };

  const writeSectionTitle = (text: string) => {
    y += 3;
    ensureSpace(9);
    writeLine(text, { size: 13, bold: true, gap: 6 });
  };

  writeLine('Resumen de acompañamiento — TÁNDEM', { size: 15, bold: true, gap: 7 });
  writeLine(data.personName, { size: 11, bold: true, gap: 6 });
  writeLine(`Generado el ${data.generatedAt.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}`, { size: 9, gap: 6 });

  if (data.changes) {
    writeSectionTitle('Cambios del período');
    writeLine(data.changes.phrase, { size: 10, gap: 5 });
    y += 1;
    data.changes.cards.forEach(card => {
      writeLine(`${card.title}: ${trendLabel(card.direction)}`, { size: 10, bold: true, gap: 5 });
      writeLine(`${card.before}   Ahora: ${card.after}`, { size: 9, gap: 5 });
      y += 1;
    });
  }

  if (data.weekly) {
    writeSectionTitle('Semana a semana');
    if (!data.weekly.rows.length) {
      writeLine('Todavía no hay datos suficientes para este gráfico.', { size: 10, gap: 5 });
    } else {
      writeLine('Semana                          Pasos     Ánimo positivo', { size: 9, bold: true, gap: 5 });
      data.weekly.rows.forEach(row => writeLine(`${row.week.padEnd(30, ' ')} ${row.steps.padEnd(9, ' ')} ${row.mood}`, { size: 9, gap: 5 }));
    }
  }

  if (data.vocabulary) {
    writeSectionTitle('Informe de vocabulario');
    const { totalUtterances, used, neverUsed } = data.vocabulary;
    writeLine(`${totalUtterances} frase${totalUtterances === 1 ? '' : 's'} dicha${totalUtterances === 1 ? '' : 's'} con el comunicador.`, { size: 10, gap: 5 });
    if (used.length) {
      writeLine('Palabras que más usa:', { size: 10, bold: true, gap: 5 });
      writeLine(used.map(u => `${u.word} (×${u.count})`).join(', '), { size: 9, gap: 5 });
    }
    if (neverUsed.length) {
      writeLine('Palabras del núcleo para probar juntos:', { size: 10, bold: true, gap: 5 });
      writeLine(neverUsed.join(', '), { size: 9, gap: 5 });
    }
  }

  if (data.patterns) {
    writeSectionTitle('Patrones detectados');
    if (!data.patterns.lines.length && !data.patterns.anticipation) {
      writeLine('Todavía no podemos detectar patrones.', { size: 10, gap: 5 });
    }
    data.patterns.lines.forEach(line => writeLine(line, { size: 9, gap: 5 }));
    if (data.patterns.anticipation) writeLine(data.patterns.anticipation, { size: 9, gap: 5 });
    y += 1;
    writeLine('Solo mostramos lo que tiene suficiente confianza. Son pistas para conversar y acompañar mejor, no un diagnóstico.', { size: 8, gap: 4 });
  }

  data.failedSections.forEach(section => {
    writeSectionTitle(section);
    writeLine(`No se pudo incluir: ${section}`, { size: 10, gap: 5 });
  });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(doc.splitTextToSize(FOOTER_TEXT, contentWidth), MARGIN_MM, pageHeight - MARGIN_MM + 6);
    doc.setTextColor(0, 0, 0);
  }

  return doc.output('blob');
}
