import { apiRequest } from '@/services/api/client';

// Unica responsabilidad: mandar eventos de uso al backend (Sesion 9).
// Archivo aparte de api.ts (que ya tiene 3000+ lineas) a proposito.
//
// Nunca propaga la excepcion: registrar que alguien completo un paso o
// registro una emocion es un extra, nunca debe poder romper la accion
// real que lo origino (misma regla que rememberPictogramChoice).
export type UsageEventType =
  | 'rutina_paso_completado'
  | 'emocion_registrada'
  | 'pictograma_elegido'
  | 'pictograma_corregido'
  | 'tarjeta_autonomia_usada'
  | 'enunciado_hablado'
  | 'pedido_dia';

export interface UsageEvent {
  tipoEvento: UsageEventType;
  entidadTipo?: string;
  entidadId?: string;
  idPictograma?: string;
  valor?: Record<string, unknown>;
  origen?: string;
}

export async function logUsageEvent(event: UsageEvent): Promise<void> {
  try {
    await apiRequest('/api/eventos-uso', { method: 'POST', body: event });
  } catch {
    // silencioso: es un log, no una accion critica
  }
}

export interface UsageEventRecord {
  id: number;
  id_usuario: number;
  tipo_evento: UsageEventType;
  entidad_tipo: string | null;
  entidad_id: string | null;
  id_pictograma: string | null;
  valor: Record<string, unknown> | null;
  origen: string | null;
  ocurrido_en: string;
}

export interface VocabularyReport {
  used: { word: string; count: number }[];
  neverUsed: string[];
  totalUtterances: number;
}

// Item 42 "informe de vocabulario": que palabras del nucleo usa esta
// persona y cuales nunca uso, calculado sobre sus enunciados hablados.
export async function fetchVocabularyReport(userId: string): Promise<VocabularyReport | null> {
  try {
    return await apiRequest<VocabularyReport>(`/api/eventos-uso/usuario/${encodeURIComponent(userId)}/informe-vocabulario`);
  } catch {
    return null;
  }
}

export async function fetchUsageEvents(userId: string, options?: { tipoEvento?: UsageEventType; limit?: number }): Promise<UsageEventRecord[]> {
  try {
    const params = new URLSearchParams();
    if (options?.tipoEvento) params.set('tipoEvento', options.tipoEvento);
    if (options?.limit) params.set('limit', String(options.limit));
    const qs = params.toString();
    return await apiRequest<UsageEventRecord[]>(`/api/eventos-uso/usuario/${encodeURIComponent(userId)}${qs ? `?${qs}` : ''}`);
  } catch {
    return [];
  }
}
