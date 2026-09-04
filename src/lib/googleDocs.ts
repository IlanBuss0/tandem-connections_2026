import { GoogleApiError, googleFetch } from "@/lib/googleAuth";

// ---------------------------------------------------------------------------
// Sistema de bloques: cada plantilla se describe como una lista de bloques
// tipados que el builder convierte en requests de batchUpdate de la Docs API.
// ---------------------------------------------------------------------------

export type Block =
  | { kind: "title"; text: string; subtitle?: string }
  | { kind: "heading"; level: 1 | 2; text: string }
  | { kind: "sectionHeader"; text: string }
  | { kind: "paragraph"; text: string; muted?: boolean }
  | { kind: "lines"; count: number }
  | { kind: "checklist"; items: string[] }
  | { kind: "bullets"; items: string[] }
  | { kind: "infoGrid"; rows: [label: string, value: string][] }
  | { kind: "table"; header: string[]; rows: string[][] }
  | { kind: "spacer" }
  | { kind: "pageBreak" }
  | { kind: "footer"; text: string };

type TableSpec = {
  rows: string[][]; // incluye la fila de header si corresponde
  headerBg?: string;
  labelColumnBg?: string;
};

// --- Colores -----------------------------------------------------------------

function hexChannel(hex: string) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  return {
    red: ((value >> 16) & 255) / 255,
    green: ((value >> 8) & 255) / 255,
    blue: (value & 255) / 255,
  };
}

function rgbColor(hex: string) {
  return { color: { rgbColor: hexChannel(hex) } };
}

/** Mezcla el color con blanco (ratio 0..1: cuanto del color original queda). */
function tint(hex: string, ratio: number) {
  const base = hexChannel(hex);
  return {
    color: {
      rgbColor: {
        red: base.red * ratio + (1 - ratio),
        green: base.green * ratio + (1 - ratio),
        blue: base.blue * ratio + (1 - ratio),
      },
    },
  };
}

/** Oscurece el color (ratio 0..1: cuanto del color original queda). */
function shade(hex: string, ratio: number) {
  const base = hexChannel(hex);
  return {
    color: {
      rgbColor: {
        red: base.red * ratio,
        green: base.green * ratio,
        blue: base.blue * ratio,
      },
    },
  };
}

const GRAY_LINE = { color: { rgbColor: { red: 0.61, green: 0.64, blue: 0.69 } } };
const GRAY_TEXT = { color: { rgbColor: { red: 0.42, green: 0.45, blue: 0.5 } } };
const WHITE = { color: { rgbColor: { red: 1, green: 1, blue: 1 } } };
const LABEL_BG = "#f1f5f9";

// --- Pass 1: texto + estilos con cursor --------------------------------------

const MARK = "⁣"; // invisible separator: no ensucia el doc si algo falla
const TABLE_MARKER = (n: number) => `${MARK}TBL_${n}${MARK}`;
const MARKER_PATTERN = new RegExp(`${MARK}TBL_(\\d+)${MARK}`);

type Pass1Result = {
  requests: any[];
  tableSpecs: TableSpec[];
};

export function buildPass1(blocks: Block[], accent: string, startIndex: number): Pass1Result {
  const inserts: any[] = [];
  const styles: any[] = [];
  const tableSpecs: TableSpec[] = [];
  let cursor = startIndex;

  const insertText = (text: string): [number, number] => {
    const start = cursor;
    inserts.push({ insertText: { location: { index: cursor }, text } });
    cursor += text.length;
    return [start, cursor];
  };

  const paragraphStyle = (range: [number, number], style: any, fields: string) => {
    styles.push({
      updateParagraphStyle: {
        range: { startIndex: range[0], endIndex: range[1] },
        paragraphStyle: style,
        fields,
      },
    });
  };

  const textStyle = (range: [number, number], style: any, fields: string) => {
    styles.push({
      updateTextStyle: {
        range: { startIndex: range[0], endIndex: range[1] },
        textStyle: style,
        fields,
      },
    });
  };

  for (const block of blocks) {
    switch (block.kind) {
      case "title": {
        const range = insertText(`${block.text}\n`);
        paragraphStyle(range, { namedStyleType: "TITLE" }, "namedStyleType");
        textStyle(
          range,
          {
            bold: true,
            fontSize: { magnitude: 20, unit: "PT" },
            foregroundColor: rgbColor(accent),
          },
          "bold,fontSize,foregroundColor",
        );
        if (block.subtitle) {
          const sub = insertText(`${block.subtitle}\n`);
          paragraphStyle(sub, { namedStyleType: "NORMAL_TEXT" }, "namedStyleType");
          textStyle(
            sub,
            {
              italic: true,
              fontSize: { magnitude: 10, unit: "PT" },
              foregroundColor: GRAY_TEXT,
            },
            "italic,fontSize,foregroundColor",
          );
        }
        break;
      }
      case "heading": {
        const range = insertText(`${block.text}\n`);
        paragraphStyle(
          range,
          {
            namedStyleType: block.level === 1 ? "HEADING_1" : "HEADING_2",
            spaceAbove: { magnitude: 16, unit: "PT" },
            spaceBelow: { magnitude: 6, unit: "PT" },
          },
          "namedStyleType,spaceAbove,spaceBelow",
        );
        textStyle(
          range,
          { bold: true, foregroundColor: rgbColor(accent) },
          "bold,foregroundColor",
        );
        break;
      }
      case "sectionHeader": {
        const range = insertText(`${block.text}\n`);
        paragraphStyle(
          range,
          {
            namedStyleType: "HEADING_2",
            shading: { backgroundColor: tint(accent, 0.12) },
            borderBottom: {
              color: rgbColor(accent),
              width: { magnitude: 1.5, unit: "PT" },
              padding: { magnitude: 2, unit: "PT" },
              dashStyle: "SOLID",
            },
            spaceAbove: { magnitude: 14, unit: "PT" },
            spaceBelow: { magnitude: 6, unit: "PT" },
          },
          "namedStyleType,shading,borderBottom,spaceAbove,spaceBelow",
        );
        textStyle(
          range,
          {
            bold: true,
            fontSize: { magnitude: 12, unit: "PT" },
            foregroundColor: shade(accent, 0.85),
          },
          "bold,fontSize,foregroundColor",
        );
        break;
      }
      case "paragraph": {
        const range = insertText(`${block.text}\n`);
        paragraphStyle(range, { namedStyleType: "NORMAL_TEXT" }, "namedStyleType");
        if (block.muted) {
          textStyle(
            range,
            {
              fontSize: { magnitude: 10, unit: "PT" },
              foregroundColor: GRAY_TEXT,
            },
            "fontSize,foregroundColor",
          );
        }
        break;
      }
      case "lines": {
        const count = Math.max(1, block.count);
        const range = insertText("\n".repeat(count));
        paragraphStyle(
          range,
          {
            namedStyleType: "NORMAL_TEXT",
            borderBottom: {
              color: GRAY_LINE,
              width: { magnitude: 0.5, unit: "PT" },
              padding: { magnitude: 1, unit: "PT" },
              dashStyle: "DOT",
            },
            lineSpacing: 150,
          },
          "namedStyleType,borderBottom,lineSpacing",
        );
        break;
      }
      case "checklist": {
        if (!block.items.length) break;
        const range = insertText(block.items.map((item) => `${item}\n`).join(""));
        paragraphStyle(range, { namedStyleType: "NORMAL_TEXT" }, "namedStyleType");
        styles.push({
          createParagraphBullets: {
            range: { startIndex: range[0], endIndex: range[1] },
            bulletPreset: "BULLET_CHECKBOX",
          },
        });
        break;
      }
      case "bullets": {
        if (!block.items.length) break;
        const range = insertText(block.items.map((item) => `${item}\n`).join(""));
        paragraphStyle(range, { namedStyleType: "NORMAL_TEXT" }, "namedStyleType");
        styles.push({
          createParagraphBullets: {
            range: { startIndex: range[0], endIndex: range[1] },
            bulletPreset: "BULLET_DISC_CIRCLE_SQUARE",
          },
        });
        break;
      }
      case "infoGrid": {
        tableSpecs.push({
          rows: block.rows.map(([label, value]) => [label, value]),
          labelColumnBg: LABEL_BG,
        });
        const range = insertText(`${TABLE_MARKER(tableSpecs.length - 1)}\n`);
        paragraphStyle(range, { namedStyleType: "NORMAL_TEXT" }, "namedStyleType");
        break;
      }
      case "table": {
        tableSpecs.push({
          rows: [block.header, ...block.rows],
          headerBg: accent,
        });
        const range = insertText(`${TABLE_MARKER(tableSpecs.length - 1)}\n`);
        paragraphStyle(range, { namedStyleType: "NORMAL_TEXT" }, "namedStyleType");
        break;
      }
      case "spacer": {
        const range = insertText("\n");
        paragraphStyle(range, { namedStyleType: "NORMAL_TEXT" }, "namedStyleType");
        break;
      }
      case "pageBreak": {
        inserts.push({ insertPageBreak: { location: { index: cursor } } });
        cursor += 2; // un page break inserta el salto Y un newline
        break;
      }
      case "footer": {
        const range = insertText(`${block.text}\n`);
        paragraphStyle(
          range,
          {
            namedStyleType: "NORMAL_TEXT",
            alignment: "CENTER",
            borderTop: {
              color: GRAY_LINE,
              width: { magnitude: 0.5, unit: "PT" },
              padding: { magnitude: 4, unit: "PT" },
              dashStyle: "SOLID",
            },
            spaceAbove: { magnitude: 18, unit: "PT" },
          },
          "namedStyleType,alignment,borderTop,spaceAbove",
        );
        textStyle(
          range,
          {
            italic: true,
            fontSize: { magnitude: 9, unit: "PT" },
            foregroundColor: GRAY_TEXT,
          },
          "italic,fontSize,foregroundColor",
        );
        break;
      }
    }
  }

  // Los estilos van DESPUES de todos los inserts: en ese punto los indices
  // calculados con el cursor ya son finales (el batch se aplica en orden).
  return { requests: [...inserts, ...styles], tableSpecs };
}

// --- Llamadas HTTP a la Docs API ----------------------------------------------

const DOCS_BASE = "https://docs.googleapis.com/v1/documents";

export async function createDoc(token: string, title: string) {
  const response = await googleFetch(token, DOCS_BASE, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
  return (await response.json()) as { documentId: string; title?: string };
}

async function docsGet(token: string, documentId: string, fields: string) {
  const response = await googleFetch(
    token,
    `${DOCS_BASE}/${encodeURIComponent(documentId)}?fields=${encodeURIComponent(fields)}`,
  );
  return await response.json();
}

async function docsBatchUpdate(token: string, documentId: string, requests: any[]) {
  if (!requests.length) return;
  await googleFetch(
    token,
    `${DOCS_BASE}/${encodeURIComponent(documentId)}:batchUpdate`,
    { method: "POST", body: JSON.stringify({ requests }) },
  );
}

export async function getDocEndIndex(token: string, documentId: string) {
  const doc = await docsGet(token, documentId, "body(content(endIndex))");
  const content = doc.body?.content || [];
  const last = content[content.length - 1];
  return Number(last?.endIndex || 1);
}

/** Lee el texto plano de un Google Doc (para mandarlo a un resumen de IA — nunca se persiste). */
export async function getDocPlainText(token: string, documentId: string): Promise<string> {
  const doc = await docsGet(token, documentId, "body(content(paragraph(elements(textRun(content)))))");
  const content = doc.body?.content || [];
  const lines: string[] = [];
  for (const element of content) {
    const paragraphElements = element.paragraph?.elements || [];
    const text = paragraphElements.map((item: any) => item.textRun?.content || "").join("");
    if (text) lines.push(text);
  }
  return lines.join("").trim();
}

// --- Pass 2 y 3: tablas --------------------------------------------------------

type MarkerLocation = { specIndex: number; start: number; end: number };

function findMarkers(doc: any): MarkerLocation[] {
  const markers: MarkerLocation[] = [];
  for (const element of doc.body?.content || []) {
    const paragraphElements = element.paragraph?.elements || [];
    const text = paragraphElements
      .map((item: any) => item.textRun?.content || "")
      .join("");
    const match = text.match(MARKER_PATTERN);
    if (!match) continue;
    markers.push({
      specIndex: Number(match[1]),
      start: Number(element.startIndex),
      end: Number(element.endIndex),
    });
  }
  return markers;
}

async function insertTablesAtMarkers(
  token: string,
  documentId: string,
  tableSpecs: TableSpec[],
) {
  const doc = await docsGet(
    token,
    documentId,
    "body(content(startIndex,endIndex,paragraph(elements(textRun(content)))))",
  );
  const markers = findMarkers(doc);
  if (markers.length !== tableSpecs.length) {
    throw new GoogleApiError(
      "No se encontraron los marcadores de tabla esperados en el documento.",
      500,
    );
  }

  // De mayor a menor indice: las operaciones no corren los marcadores previos.
  const requests: any[] = [];
  for (const marker of [...markers].sort((a, b) => b.start - a.start)) {
    const spec = tableSpecs[marker.specIndex];
    // Borra el texto del marcador (deja el newline del parrafo como espaciador).
    requests.push({
      deleteContentRange: {
        range: { startIndex: marker.start, endIndex: marker.end - 1 },
      },
    });
    requests.push({
      insertTable: {
        rows: spec.rows.length,
        columns: spec.rows[0]?.length || 2,
        location: { index: marker.start },
      },
    });
  }
  await docsBatchUpdate(token, documentId, requests);
}

async function fillTables(
  token: string,
  documentId: string,
  tableSpecs: TableSpec[],
  fromIndex: number,
) {
  const doc = await docsGet(token, documentId, "body(content(startIndex,table))");
  const tables = (doc.body?.content || [])
    .filter((item: any) => item.table && Number(item.startIndex) >= fromIndex)
    .slice(-tableSpecs.length);
  if (tables.length !== tableSpecs.length) {
    throw new GoogleApiError(
      "Las tablas insertadas no coinciden con la plantilla.",
      500,
    );
  }

  // Tablas de la ultima a la primera; celdas en orden inverso. Todos los
  // indices usados son los originales del GET: cada request modifica solo
  // posiciones mayores a las que quedan por procesar.
  const requests: any[] = [];
  for (let t = tables.length - 1; t >= 0; t--) {
    const spec = tableSpecs[t];
    const tableStart = Number(tables[t].startIndex);
    const tableRows = tables[t].table.tableRows || [];
    const columns = spec.rows[0]?.length || 0;

    for (let r = tableRows.length - 1; r >= 0; r--) {
      const cells = tableRows[r]?.tableCells || [];
      for (let c = cells.length - 1; c >= 0; c--) {
        const text = spec.rows[r]?.[c];
        if (!text) continue;
        const insertAt = Number(cells[c].startIndex) + 1;
        requests.push({
          insertText: { location: { index: insertAt }, text },
        });
        const isHeaderCell = Boolean(spec.headerBg) && r === 0;
        const isLabelCell = Boolean(spec.labelColumnBg) && c === 0;
        if (isHeaderCell || isLabelCell) {
          requests.push({
            updateTextStyle: {
              range: { startIndex: insertAt, endIndex: insertAt + text.length },
              textStyle: {
                bold: true,
                ...(isHeaderCell ? { foregroundColor: WHITE } : {}),
              },
              fields: isHeaderCell ? "bold,foregroundColor" : "bold",
            },
          });
        }
      }
    }

    if (spec.headerBg) {
      requests.push({
        updateTableCellStyle: {
          tableRange: {
            tableCellLocation: {
              tableStartLocation: { index: tableStart },
              rowIndex: 0,
              columnIndex: 0,
            },
            rowSpan: 1,
            columnSpan: columns,
          },
          tableCellStyle: { backgroundColor: rgbColor(spec.headerBg) },
          fields: "backgroundColor",
        },
      });
    }
    if (spec.labelColumnBg) {
      requests.push({
        updateTableCellStyle: {
          tableRange: {
            tableCellLocation: {
              tableStartLocation: { index: tableStart },
              rowIndex: 0,
              columnIndex: 0,
            },
            rowSpan: spec.rows.length,
            columnSpan: 1,
          },
          tableCellStyle: { backgroundColor: rgbColor(spec.labelColumnBg) },
          fields: "backgroundColor",
        },
      });
    }
  }
  await docsBatchUpdate(token, documentId, requests);
}

// --- Orquestador ----------------------------------------------------------------

/**
 * Inserta los bloques en el documento a partir de startIndex (1 para un doc
 * nuevo; endIndex-1 para agregar al final). Multi-pass: texto+estilos, luego
 * tablas en los marcadores, luego relleno y estilo de celdas.
 */
export async function insertBlocks(
  documentId: string,
  token: string,
  blocks: Block[],
  accent: string,
  opts?: { startIndex?: number },
): Promise<void> {
  const startIndex = opts?.startIndex ?? 1;
  const { requests, tableSpecs } = buildPass1(blocks, accent, startIndex);
  if (!requests.length) return;

  await docsBatchUpdate(token, documentId, requests);
  if (!tableSpecs.length) return;

  await insertTablesAtMarkers(token, documentId, tableSpecs);
  await fillTables(token, documentId, tableSpecs, startIndex);
}
