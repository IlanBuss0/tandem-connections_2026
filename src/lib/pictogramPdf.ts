import { jsPDF } from 'jspdf';
import type { PictogramizedPhrase } from '@/data/api';

// Unica responsabilidad: convertir resultados ya traducidos en un PDF
// imprimible (Sesion 4). No sabe nada de Groq ni de matching, solo dibuja lo
// que ya vino resuelto.
const CELLS_PER_ROW = 3;
const CELL_SIZE_MM = 55;
const MARGIN_MM = 15;
const IMAGE_SIZE_MM = 35;

// Carga una imagen cross-origin (Supabase) como dataURL para poder dibujarla
// en el canvas del PDF. Si falla (CORS, red, imagen caida), se resuelve a
// null en vez de rechazar: una frase sin imagen no debe tirar abajo el
// export completo, se imprime igual con el texto solo.
function loadImageAsDataUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function exportPictogramStripToPdf(results: PictogramizedPhrase[]): Promise<void> {
  const images = await Promise.all(
    results.map((r) => (r.pictogram ? loadImageAsDataUrl(r.pictogram.imageUrl) : Promise.resolve(null))),
  );

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const rowsPerPage = Math.floor((pageHeight - MARGIN_MM * 2) / CELL_SIZE_MM);
  const cellsPerPage = rowsPerPage * CELLS_PER_ROW;

  results.forEach((result, index) => {
    const posInPage = index % cellsPerPage;
    if (index > 0 && posInPage === 0) doc.addPage();

    const col = posInPage % CELLS_PER_ROW;
    const row = Math.floor(posInPage / CELLS_PER_ROW);
    const x = MARGIN_MM + col * CELL_SIZE_MM;
    const y = MARGIN_MM + row * CELL_SIZE_MM;
    const centerX = x + CELL_SIZE_MM / 2;

    const imageDataUrl = images[index];
    if (imageDataUrl) {
      doc.addImage(imageDataUrl, 'PNG', centerX - IMAGE_SIZE_MM / 2, y, IMAGE_SIZE_MM, IMAGE_SIZE_MM);
    } else {
      doc.setDrawColor(200, 200, 200);
      doc.setLineDashPattern([2, 2], 0);
      doc.rect(centerX - IMAGE_SIZE_MM / 2, y, IMAGE_SIZE_MM, IMAGE_SIZE_MM);
      doc.setLineDashPattern([], 0);
    }

    doc.setFontSize(10);
    doc.setTextColor(74, 74, 90);
    doc.text(result.text, centerX, y + IMAGE_SIZE_MM + 6, { align: 'center', maxWidth: CELL_SIZE_MM - 4 });
  });

  doc.save(`pictogramas-${Date.now()}.pdf`);
}
