import { apiRequest, apiUploadFile } from '@/services/api/client';
import type { Pictogram } from '@/data/mockData';

// Unica responsabilidad: cliente del generador de pictogramas con IA
// (ya existente desde antes de este roadmap) para el flujo "foto ->
// pictograma" (Sesion 23, item 16). Archivo aparte de api.ts (3000+
// lineas) a proposito, mismo criterio que usageApi.ts.
//
// Restriccion real del backend: solo tutores y profesionales pueden
// generar pictogramas con IA (AiPictogramService.getTargetsAsync). Este
// modulo no la duplica ni la esconde — el componente que lo consuma debe
// manejar el 403 con gracia (ver PhotoToPictogramButton.tsx).
export interface AiPictogramTarget {
  id: number;
  usuarioId: number | null;
  name: string;
}

export async function fetchAiPictogramTargets(): Promise<AiPictogramTarget[]> {
  return apiRequest<AiPictogramTarget[]>('/api/pictograms/ai/targets');
}

export interface AiPictogramGeneration {
  id: string;
  status: string;
  previewUrl?: string | null;
}

export async function generatePictogramFromPhoto(
  file: File,
  params: { name: string; description: string; targetPertenecienteId: number; category?: string },
): Promise<AiPictogramGeneration> {
  const formData = new FormData();
  formData.append('reference', file);
  formData.append('name', params.name);
  formData.append('description', params.description);
  formData.append('category', params.category || 'otros');
  formData.append('mode', 'final');
  formData.append('targetPertenecienteId', String(params.targetPertenecienteId));
  return apiUploadFile<AiPictogramGeneration>('/api/pictograms/ai/generations', formData);
}

export async function savePictogramGeneration(id: string, targetPertenecienteIds: number[]): Promise<{ id: string }> {
  return apiRequest<{ id: string }>(`/api/pictograms/ai/generations/${encodeURIComponent(id)}/save`, {
    method: 'POST',
    body: { targetPertenecienteIds },
  });
}

export function buildGeneratedPictogram(id: string, name: string, imageUrl: string): Pictogram {
  return { id, name, emoji: '📷', imageUrl, category: 'otros', tags: [] };
}
