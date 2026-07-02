import type { MemoryItem, MemorySettings } from './miniGames';

export const DEFAULT_MEMORY_SETTINGS: MemorySettings = {
  previewEnabled: true,
  previewSeconds: 3,
  timed: false,
  timeLimitSeconds: 60,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function normalizeMemory(memory?: MemoryItem): Required<MemoryItem> {
  return {
    pairs: (memory?.pairs || []).map(pair => ({
      a: pair.a || '',
      b: pair.b || '',
      ...(pair.aLabel ? { aLabel: pair.aLabel } : {}),
      ...(pair.bLabel ? { bLabel: pair.bLabel } : {}),
    })),
    settings: {
      previewEnabled: memory?.settings?.previewEnabled ?? DEFAULT_MEMORY_SETTINGS.previewEnabled,
      previewSeconds: clamp(Math.round(memory?.settings?.previewSeconds ?? DEFAULT_MEMORY_SETTINGS.previewSeconds), 2, 8),
      timed: memory?.settings?.timed ?? DEFAULT_MEMORY_SETTINGS.timed,
      timeLimitSeconds: clamp(Math.round(memory?.settings?.timeLimitSeconds ?? DEFAULT_MEMORY_SETTINGS.timeLimitSeconds), 30, 180),
    },
  };
}

export function memoryValidationError(memory?: MemoryItem): string | null {
  const normalized = normalizeMemory(memory);
  if (normalized.pairs.length < 4 || normalized.pairs.length > 8) return 'Agregá entre 4 y 8 parejas.';
  if (normalized.pairs.some(pair => !pair.a.trim() || !pair.b.trim())) return 'Completá los dos lados de cada pareja.';
  const values = normalized.pairs.flatMap(pair => [pair.a.trim().toLocaleLowerCase(), pair.b.trim().toLocaleLowerCase()]);
  if (new Set(values).size !== values.length) return 'Cada carta debe tener un contenido diferente para evitar asociaciones ambiguas.';
  return null;
}

export function memoryScore(pairCount: number, attempts: number): number {
  if (pairCount <= 0) return 0;
  return Math.max(40, Math.round((pairCount / Math.max(attempts, pairCount)) * 100));
}
