import type { Block } from "@/lib/googleDocs";

export type PreviewRowKind =
  | "title"
  | "subtitle"
  | "sectionHeader"
  | "heading"
  | "text"
  | "textMuted"
  | "checklist"
  | "bullets";

export interface PreviewRow {
  kind: PreviewRowKind;
  widthPct: number;
  itemCount?: number;
}

export interface PreviewSpec {
  rows: PreviewRow[];
  hasTable: boolean;
  hasInfoGrid: boolean;
  hasFooter: boolean;
}

/**
 * Deriva una especificacion visual compacta a partir de los mismos bloques
 * que arma el Doc real (googleDocs.ts) — asi el preview nunca se desincroniza
 * de la plantilla real, a diferencia de un mockup escrito a mano aparte.
 */
export function buildTemplatePreviewSpec(blocks: Block[], maxRows = 7): PreviewSpec {
  const rows: PreviewRow[] = [];
  let hasTable = false;
  let hasInfoGrid = false;
  let hasFooter = false;

  for (const block of blocks) {
    if (rows.length >= maxRows) break;
    switch (block.kind) {
      case "title":
        rows.push({ kind: "title", widthPct: 72 });
        if (block.subtitle) rows.push({ kind: "subtitle", widthPct: 48 });
        break;
      case "heading":
        rows.push({ kind: "heading", widthPct: block.level === 1 ? 60 : 42 });
        break;
      case "sectionHeader":
        rows.push({ kind: "sectionHeader", widthPct: 88 });
        break;
      case "paragraph":
        rows.push({
          kind: block.muted ? "textMuted" : "text",
          widthPct: Math.min(95, 55 + (block.text.length % 35)),
        });
        break;
      case "lines":
        rows.push({ kind: "text", widthPct: 92 });
        break;
      case "checklist":
        rows.push({ kind: "checklist", widthPct: 60, itemCount: Math.min(block.items.length, 3) });
        break;
      case "bullets":
        rows.push({ kind: "bullets", widthPct: 60, itemCount: Math.min(block.items.length, 3) });
        break;
      case "table":
        hasTable = true;
        break;
      case "infoGrid":
        hasInfoGrid = true;
        break;
      case "footer":
        hasFooter = true;
        break;
      case "spacer":
      case "pageBreak":
        break;
    }
  }

  return { rows: rows.slice(0, maxRows), hasTable, hasInfoGrid, hasFooter };
}
