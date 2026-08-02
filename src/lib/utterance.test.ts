import { describe, expect, it } from "vitest";
import { utteranceToText } from "@/lib/utterance";

describe("utteranceToText", () => {
  it("une los tokens en orden separados por espacio", () => {
    expect(utteranceToText([
      { type: 'pictogram', text: 'yo' },
      { type: 'pictogram', text: 'querer' },
      { type: 'pictogram', text: 'agua' },
    ])).toBe('yo querer agua');
  });

  it("descarta tokens vacios", () => {
    expect(utteranceToText([{ type: 'text', text: 'hola' }, { type: 'text', text: '   ' }])).toBe('hola');
  });

  it("lista vacia da texto vacio", () => {
    expect(utteranceToText([])).toBe('');
  });
});
