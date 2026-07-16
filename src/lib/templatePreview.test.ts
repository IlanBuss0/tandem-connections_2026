import { describe, expect, it } from "vitest";
import { selectPreviewBlocks, truncateText } from "@/lib/templatePreview";
import type { Block } from "@/lib/googleDocs";

describe("selectPreviewBlocks", () => {
  it("conserva los bloques reales (mismo texto) y descarta spacer/pageBreak", () => {
    const blocks: Block[] = [
      { kind: "title", text: "Nota de sesión", subtitle: "Sub" },
      { kind: "spacer" },
      { kind: "sectionHeader", text: "Motivo" },
      { kind: "pageBreak" },
      { kind: "lines", count: 3 },
    ];
    const selected = selectPreviewBlocks(blocks);
    expect(selected).toEqual([
      { kind: "title", text: "Nota de sesión", subtitle: "Sub" },
      { kind: "sectionHeader", text: "Motivo" },
      { kind: "lines", count: 3 },
    ]);
  });

  it("respeta el limite maxBlocks", () => {
    const blocks: Block[] = Array.from({ length: 20 }, (_, i) => ({
      kind: "paragraph",
      text: `linea ${i}`,
    }));
    expect(selectPreviewBlocks(blocks, 4)).toHaveLength(4);
  });
});

describe("truncateText", () => {
  it("no toca texto que ya entra", () => {
    expect(truncateText("Motivo de consulta", 30)).toBe("Motivo de consulta");
  });

  it("corta y agrega elipsis cuando no entra", () => {
    const result = truncateText("Un texto bastante largo para el card", 15);
    expect(result).toBe("Un texto basta…");
    expect(result.length).toBe(15);
  });
});
