import { describe, expect, it } from "vitest";
import { buildTemplatePreviewSpec } from "@/lib/templatePreview";
import type { Block } from "@/lib/googleDocs";

describe("buildTemplatePreviewSpec", () => {
  it("mapea cada tipo de bloque a una fila del tipo correspondiente", () => {
    const blocks: Block[] = [
      { kind: "title", text: "Nota", subtitle: "Sub" },
      { kind: "sectionHeader", text: "Motivo" },
      { kind: "lines", count: 3 },
      { kind: "checklist", items: ["a", "b", "c", "d"] },
      { kind: "footer", text: "Confidencial" },
    ];
    const spec = buildTemplatePreviewSpec(blocks);
    expect(spec.rows.map((r) => r.kind)).toEqual([
      "title",
      "subtitle",
      "sectionHeader",
      "text",
      "checklist",
    ]);
    expect(spec.rows.find((r) => r.kind === "checklist")?.itemCount).toBe(3); // capado a 3
    expect(spec.hasFooter).toBe(true);
  });

  it("marca hasTable/hasInfoGrid sin agregarlos como filas", () => {
    const blocks: Block[] = [
      { kind: "infoGrid", rows: [["Paciente", "Juan"]] },
      { kind: "table", header: ["A", "B"], rows: [["", ""]] },
    ];
    const spec = buildTemplatePreviewSpec(blocks);
    expect(spec.hasInfoGrid).toBe(true);
    expect(spec.hasTable).toBe(true);
    expect(spec.rows).toHaveLength(0);
  });

  it("respeta el limite maxRows sin importar cuantos bloques haya", () => {
    const blocks: Block[] = Array.from({ length: 20 }, () => ({
      kind: "paragraph",
      text: "linea",
    }));
    const spec = buildTemplatePreviewSpec(blocks, 4);
    expect(spec.rows).toHaveLength(4);
  });

  it("ignora spacer y pageBreak", () => {
    const blocks: Block[] = [{ kind: "spacer" }, { kind: "pageBreak" }, { kind: "heading", level: 1, text: "X" }];
    const spec = buildTemplatePreviewSpec(blocks);
    expect(spec.rows).toEqual([{ kind: "heading", widthPct: 60 }]);
  });
});
