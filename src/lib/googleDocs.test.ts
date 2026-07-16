import { describe, expect, it } from "vitest";
import { buildPass1, type Block } from "@/lib/googleDocs";

const ACCENT = "#7c3aed";

function insertsOf(requests: any[]) {
  return requests.filter((request) => request.insertText);
}

function stylesOf(requests: any[]) {
  return requests.filter((request) => !request.insertText && !request.insertPageBreak);
}

describe("buildPass1 (cursor de índices de la Docs API)", () => {
  it("inserta texto en índices consecutivos y estila con rangos exactos", () => {
    const blocks: Block[] = [
      { kind: "title", text: "Hola" }, // "Hola\n" → [1, 6)
      { kind: "lines", count: 2 }, // "\n\n" → [6, 8)
      { kind: "checklist", items: ["a", "bb"] }, // "a\nbb\n" → [8, 13)
    ];
    const { requests, tableSpecs } = buildPass1(blocks, ACCENT, 1);

    const inserts = insertsOf(requests);
    expect(inserts.map((r) => r.insertText.location.index)).toEqual([1, 6, 8]);
    expect(inserts.map((r) => r.insertText.text)).toEqual([
      "Hola\n",
      "\n\n",
      "a\nbb\n",
    ]);

    // Todos los estilos van después de todos los inserts.
    const firstStyleAt = requests.findIndex((r) => !r.insertText);
    expect(requests.slice(firstStyleAt).every((r) => !r.insertText)).toBe(true);

    // El estilo del título cubre exactamente su rango.
    const titleStyle = stylesOf(requests).find((r) => r.updateTextStyle);
    expect(titleStyle.updateTextStyle.range).toEqual({ startIndex: 1, endIndex: 6 });

    // El checklist usa checkboxes reales sobre su rango.
    const bullets = requests.find((r) => r.createParagraphBullets);
    expect(bullets.createParagraphBullets.range).toEqual({ startIndex: 8, endIndex: 13 });
    expect(bullets.createParagraphBullets.bulletPreset).toBe("BULLET_CHECKBOX");

    expect(tableSpecs).toHaveLength(0);
  });

  it("un pageBreak avanza el cursor +2 (salto + newline)", () => {
    const blocks: Block[] = [
      { kind: "pageBreak" },
      { kind: "heading", level: 1, text: "Sesión 15/07" },
    ];
    const { requests } = buildPass1(blocks, ACCENT, 100);

    const pageBreak = requests.find((r) => r.insertPageBreak);
    expect(pageBreak.insertPageBreak.location.index).toBe(100);

    const heading = insertsOf(requests)[0];
    expect(heading.insertText.location.index).toBe(102);

    const headingStyle = requests.find((r) => r.updateParagraphStyle);
    expect(headingStyle.updateParagraphStyle.range.startIndex).toBe(102);
    expect(headingStyle.updateParagraphStyle.paragraphStyle.namedStyleType).toBe(
      "HEADING_1",
    );
  });

  it("las tablas se difieren como marcadores y specs en orden", () => {
    const blocks: Block[] = [
      { kind: "infoGrid", rows: [["Paciente", "Juan"]] },
      { kind: "table", header: ["A", "B"], rows: [["", ""]] },
    ];
    const { requests, tableSpecs } = buildPass1(blocks, ACCENT, 1);

    expect(tableSpecs).toHaveLength(2);
    expect(tableSpecs[0].labelColumnBg).toBeTruthy();
    expect(tableSpecs[0].rows).toEqual([["Paciente", "Juan"]]);
    expect(tableSpecs[1].headerBg).toBe(ACCENT);
    expect(tableSpecs[1].rows).toEqual([
      ["A", "B"],
      ["", ""],
    ]);

    const inserts = insertsOf(requests);
    expect(inserts[0].insertText.text).toContain("TBL_0");
    expect(inserts[1].insertText.text).toContain("TBL_1");
    // El segundo marcador arranca donde termina el primero.
    expect(inserts[1].insertText.location.index).toBe(
      1 + inserts[0].insertText.text.length,
    );
  });

  it("acentos y caracteres multibyte cuentan como unidades UTF-16 (igual que Docs)", () => {
    const blocks: Block[] = [
      { kind: "paragraph", text: "Sesión Ñandú" }, // 12 chars + \n
      { kind: "paragraph", text: "x" },
    ];
    const { requests } = buildPass1(blocks, ACCENT, 1);
    const inserts = insertsOf(requests);
    expect(inserts[1].insertText.location.index).toBe(1 + "Sesión Ñandú\n".length);
  });
});
