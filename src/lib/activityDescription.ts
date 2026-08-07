const METADATA_LINE = /^(?:Objetivo|Pasos|Juego):/i;
const INLINE_METADATA = /\s+(?:Objetivo|Pasos|Juego):/i;

/** Devuelve solamente la descripción visible de una actividad personalizada. */
export function activityDisplayDescription(description?: string | null): string {
  const value = String(description || '').replace(/\r\n?/g, '\n').trim();
  if (!value) return '';

  const visibleLines = value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !METADATA_LINE.test(line));

  const visible = visibleLines.join('\n').trim();
  const inlineMetadataIndex = visible.search(INLINE_METADATA);

  return (inlineMetadataIndex >= 0 ? visible.slice(0, inlineMetadataIndex) : visible).trim();
}
