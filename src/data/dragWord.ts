const ALLOWED_DRAG_WORD_CHARACTERS = /[^a-záéíóúñü\s]/g;

export function normalizeDragAnswer(value?: string): string {
  return normalizeDragAnswerInput(value).trim();
}

export function normalizeDragAnswerInput(value?: string): string {
  return String(value || "")
    .toLocaleLowerCase("es")
    .replace(ALLOWED_DRAG_WORD_CHARACTERS, "")
    .replace(/\s+/g, " ")
    .replace(/^\s+/, "");
}

export function dragAnswerWords(value?: string): string[] {
  const normalized = normalizeDragAnswer(value);
  return normalized ? normalized.split(" ") : [];
}

export function dragAnswerLetters(value?: string): string[] {
  return dragAnswerWords(value).flatMap((word) => word.split(""));
}
