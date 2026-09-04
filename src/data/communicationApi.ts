import { apiRequest } from '@/services/api/client';

// Unica responsabilidad: pedir el vocabulario nucleo resuelto (Sesion 11).
// Archivo aparte de api.ts a proposito, mismo criterio que usageApi.ts.
export interface NucleoPictogram {
  id: string;
  name: string;
  imageUrl: string;
  source: string;
}

export interface NucleoWord {
  word: string;
  pictogram: NucleoPictogram | null;
}

export type NucleoVocabulario = Record<string, NucleoWord[]>;

export async function fetchNucleoVocabulario(language = 'es'): Promise<NucleoVocabulario> {
  try {
    return await apiRequest<NucleoVocabulario>(`/api/pictograms/nucleo?language=${encodeURIComponent(language)}`);
  } catch {
    return {};
  }
}
