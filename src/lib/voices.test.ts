import { describe, expect, it } from "vitest";
import { pickSpanishVoice } from "@/lib/voices";

function voice(lang: string, name = lang): SpeechSynthesisVoice {
  return { lang, name, default: false, localService: true, voiceURI: name } as SpeechSynthesisVoice;
}

describe("pickSpanishVoice", () => {
  it("prefiere es-AR si esta disponible", () => {
    const voices = [voice("en-US"), voice("es-ES"), voice("es-AR")];
    expect(pickSpanishVoice(voices)?.lang).toBe("es-AR");
  });

  it("cae a cualquier es-* si no hay es-AR", () => {
    const voices = [voice("en-US"), voice("es-ES")];
    expect(pickSpanishVoice(voices)?.lang).toBe("es-ES");
  });

  it("devuelve null si no hay ninguna voz en espanol", () => {
    const voices = [voice("en-US"), voice("fr-FR")];
    expect(pickSpanishVoice(voices)).toBeNull();
  });

  it("devuelve null con una lista vacia", () => {
    expect(pickSpanishVoice([])).toBeNull();
  });
});
