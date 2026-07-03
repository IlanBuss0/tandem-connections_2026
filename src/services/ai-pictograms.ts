import { apiRequest, apiUploadFile } from '@/services/api/client';

export type AiTarget = { id: number; name: string; avatar?: string };
export type AiGeneration = { id: string; previewUrl: string; name: string; description: string; category: string; mode: 'quick' | 'final'; targetPertenecienteId: number; status: string };
export type AiCreation = { id: string; name: string; description?: string; category: string; imageUrl: string; status: 'private' | 'pending_review' | 'approved' | 'rejected'; reviewReason?: string; targetPertenecienteId: number; createdAt?: string; referenceHadPeople?: boolean };

const root = '/api/pictogramas/ai';

export const aiPictogramsApi = {
  targets: () => apiRequest<AiTarget[]>(root + '/targets'),
  generate: (data: FormData) => apiUploadFile<AiGeneration>(root + '/generations', data),
  discard: (id: string) => apiRequest(root + '/generations/' + id, { method: 'DELETE' }),
  save: (id: string) => apiRequest<AiCreation>(root + '/generations/' + id + '/save', { method: 'POST' }),
  mine: () => apiRequest<AiCreation[]>(root + '/creations/mine'),
  available: () => apiRequest<AiCreation[]>(root + '/creations/available'),
  update: (id: string, body: { name: string; description: string; category: string }) => apiRequest<AiCreation>(root + '/creations/' + id, { method: 'PATCH', body }),
  submit: (id: string) => apiRequest<AiCreation>(root + '/creations/' + id + '/submit', { method: 'POST' }),
  moderation: () => apiRequest<AiCreation[]>(root + '/moderation'),
  review: (id: string, approved: boolean, reason?: string) => apiRequest<AiCreation>(root + '/moderation/' + id + '/review', { method: 'POST', body: { decision: approved ? 'approve' : 'reject', reason } }),
};
