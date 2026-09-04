import type { Block } from "@/lib/googleDocs";

/**
 * Selecciona los bloques "visibles" de una plantilla para el preview (todo
 * excepto separadores/saltos de página), capados a una cantidad razonable
 * para una tarjeta chica. Se devuelven los Block reales (mismo tipo que usa
 * el builder de Docs) para que el preview muestre el TEXTO REAL de la
 * plantilla, no un mockup abstracto — y así nunca se desincroniza si se
 * edita una plantilla.
 */
export function selectPreviewBlocks(blocks: Block[], maxBlocks = 9): Block[] {
  return blocks
    .filter((block) => block.kind !== "spacer" && block.kind !== "pageBreak")
    .slice(0, maxBlocks);
}

export function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}
