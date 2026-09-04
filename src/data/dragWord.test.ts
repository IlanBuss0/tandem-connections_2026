import { describe, expect, it } from "vitest";
import { dragAnswerLetters, dragAnswerWords, normalizeDragAnswer, normalizeDragAnswerInput } from "./dragWord";

describe("drag word phrases", () => {
  it("preserves one separator between words", () => {
    expect(normalizeDragAnswer("  Manzana   ROJA  ")).toBe("manzana roja");
    expect(dragAnswerWords("manzana roja")).toEqual(["manzana", "roja"]);
  });

  it("allows a trailing separator while the creator is typing", () => {
    expect(normalizeDragAnswerInput("Manzana  ")).toBe("manzana ");
  });

  it("keeps Spanish letters and removes punctuation", () => {
    expect(normalizeDragAnswer("Pingüino, Ñandú!")).toBe("pingüino ñandú");
  });

  it("does not create draggable spaces", () => {
    expect(dragAnswerLetters("manzana roja")).toEqual([
      "m", "a", "n", "z", "a", "n", "a", "r", "o", "j", "a",
    ]);
  });

  it("keeps single-word answers compatible", () => {
    expect(dragAnswerWords("banana")).toEqual(["banana"]);
    expect(dragAnswerLetters("banana")).toEqual(["b", "a", "n", "a", "n", "a"]);
  });
});
