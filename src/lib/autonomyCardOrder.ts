import type { AutonomyCardUsage } from '@/data/usageApi';

// Unica responsabilidad: ordenar un array estatico de tarjetas (autonomia,
// "no puedo hablar") segun cuanto las usa de verdad esta persona (Sesion
// 25, perfil de memoria). Puro — no sabe de donde sale `usage`.
//
// Sin datos (usage vacio, o ninguna entrada de este entidadTipo supero el
// piso minimo de uso que ya aplica el backend), se devuelve el orden
// original sin tocar — nunca reordena por casualidad ni por un solo toque.
// Array.prototype.sort es estable: dos tarjetas empatadas en cantidad de
// usos (incluido "ninguna de las dos tiene datos") mantienen su orden
// relativo original.
export function sortByAutonomyUsage<T extends { id: string }>(
  items: readonly T[],
  usage: AutonomyCardUsage[],
  entidadTipo: string,
): T[] {
  const countById = new Map(
    (usage || [])
      .filter((entry) => entry.entidadTipo === entidadTipo)
      .map((entry) => [entry.entidadId, entry.count]),
  );
  if (countById.size === 0) return [...items];

  return [...items].sort((a, b) => (countById.get(b.id) || 0) - (countById.get(a.id) || 0));
}
