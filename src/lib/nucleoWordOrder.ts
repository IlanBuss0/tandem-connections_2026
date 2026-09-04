import type { NucleoWord } from '@/data/communicationApi';
import type { VocabularyReport } from '@/data/usageApi';

// Unica responsabilidad: ordenar las palabras de una categoria del
// vocabulario nucleo del Comunicador segun cuanto las usa de verdad esta
// persona (Sesion 25, perfil de memoria). Puro, se aplica DESPUES de leer
// el nucleo — el endpoint /api/pictograms/nucleo cachea el resultado
// COMPARTIDO entre todos los usuarios (Sesion 11), asi que la
// personalizacion no puede vivir ahi adentro sin filtrarse entre cuentas.
//
// Sin datos de vocabulario, se devuelve el orden original — mismo
// criterio que sortByAutonomyUsage (autonomyCardOrder.ts): nunca
// reordena por casualidad, Array.sort es estable.
export function sortWordsByUsage(words: NucleoWord[], vocabularyReport: VocabularyReport | null): NucleoWord[] {
  if (!vocabularyReport || vocabularyReport.used.length === 0) return [...words];

  const countByWord = new Map(vocabularyReport.used.map((entry) => [entry.word, entry.count]));
  return [...words].sort((a, b) => (countByWord.get(b.word) || 0) - (countByWord.get(a.word) || 0));
}
