const METADATA_LINE = /^(?:Objetivo|Pasos|Juego):/i;
const INLINE_METADATA = /\s+(?:Objetivo|Pasos|Juego):/i;

function parsedObject(value: string): Record<string, unknown> | null {
  if (!value.startsWith('{') && !value.startsWith('[')) return null;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.find(item => item && typeof item === 'object') || null;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/** Evita mostrar JSON serializado como título de una actividad. */
export function activityDisplayTitle(title?: unknown): string {
  const value = typeof title === 'string' ? title.trim() : '';
  if (!value) return 'Actividad';
  const parsed = parsedObject(value);
  if (!parsed) return value;
  const readable = parsed.title ?? parsed.titulo ?? parsed.name ?? parsed.nombre ?? parsed.label;
  return typeof readable === 'string' && readable.trim() ? readable.trim() : 'Actividad';
}

/** Devuelve solamente la descripción visible de una actividad personalizada. */
export function activityDisplayDescription(description?: string | null): string {
  const value = String(description || '').replace(/\r\n?/g, '\n').trim();
  if (!value) return '';

  const parsed = parsedObject(value);
  if (parsed) {
    const readable = parsed.description ?? parsed.descripcion ?? parsed.summary ?? parsed.resumen;
    return typeof readable === 'string' ? activityDisplayDescription(readable) : '';
  }

  const visibleLines = value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !METADATA_LINE.test(line));

  const visible = visibleLines.join('\n').trim();
  const inlineMetadataIndex = visible.search(INLINE_METADATA);

  return (inlineMetadataIndex >= 0 ? visible.slice(0, inlineMetadataIndex) : visible).trim();
}
