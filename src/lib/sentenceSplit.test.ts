import { describe, expect, it } from "vitest";
import { splitIntoPhrases } from "@/lib/sentenceSplit";

describe("splitIntoPhrases", () => {
  it("respeta los saltos de linea explicitos", () => {
    expect(splitIntoPhrases("Lavarse los dientes\nDucharse\nDesayunar")).toEqual([
      "Lavarse los dientes",
      "Ducharse",
      "Desayunar",
    ]);
  });

  it("parte un parrafo pegado en oraciones por puntuacion", () => {
    expect(splitIntoPhrases("Lavarse los dientes. Ducharse. Desayunar cereal.")).toEqual([
      "Lavarse los dientes",
      "Ducharse",
      "Desayunar cereal",
    ]);
  });

  it("parte por signos de exclamacion e interrogacion", () => {
    expect(splitIntoPhrases("Que alegria! Vamos a la plaza? Despues volvemos a casa.")).toEqual([
      "Que alegria",
      "Vamos a la plaza",
      "Despues volvemos a casa",
    ]);
  });

  it("parte por punto y coma", () => {
    expect(splitIntoPhrases("Lavarse las manos; comer; lavarse los dientes")).toEqual([
      "Lavarse las manos",
      "comer",
      "lavarse los dientes",
    ]);
  });

  it("no parte numeros decimales", () => {
    expect(splitIntoPhrases("Tomar 3.5 litros de agua")).toEqual(["Tomar 3.5 litros de agua"]);
  });

  it("descarta lineas vacias y espacios de mas", () => {
    expect(splitIntoPhrases("  Ducharse  \n\n  \n Desayunar ")).toEqual(["Ducharse", "Desayunar"]);
  });

  it("un texto sin puntuacion ni saltos de linea queda como una sola frase", () => {
    expect(splitIntoPhrases("Ducharse")).toEqual(["Ducharse"]);
  });

  it("texto vacio devuelve array vacio", () => {
    expect(splitIntoPhrases("")).toEqual([]);
    expect(splitIntoPhrases("   \n  \n ")).toEqual([]);
  });
});
