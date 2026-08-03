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

export interface EventTypePattern {
  type: string;
  negativeRatio: number;
  sampleSize: number;
}

export interface AnticipationSupport {
  viewedPositiveRatio: number;
  notViewedPositiveRatio: number;
  difference: number;
  helps: boolean;
}

export interface PatternsReport {
  eventTypePatterns: EventTypePattern[];
  anticipationSupport: AnticipationSupport | null;
}

// Item 41 "deteccion de patrones" ⭐ + item 43 "que apoyos funcionan": cruza
// calendario, emociones y vistas de historia social. Piso minimo de datos
// aplicado en el backend (modules/usage/pattern-detection.js) — si no hay
// suficiente, esta funcion simplemente devuelve arrays/null vacios, y esa
// es la respuesta correcta (no "error").
export async function fetchPatternsReport(userId: string): Promise<PatternsReport | null> {
  try {
    return await apiRequest<PatternsReport>(`/api/eventos-uso/usuario/${encodeURIComponent(userId)}/patrones`);
  } catch {
    return null;
  }
}

export interface EvolutionWeek {
  week: string;
  routineCompletions: number;
  positiveEmotionRatio: number | null;
  emotionSampleSize: number;
}

// Item 44 "evolucion en el tiempo": pasos completados y animo semana a
// semana (ultimas 8 semanas con datos). Sin piso minimo — es descriptivo,
// no una conclusion causal (esa es /patrones, ver PatternsReportView).
export async function fetchEvolutionReport(userId: string): Promise<EvolutionWeek[]> {
  try {
    return await apiRequest<EvolutionWeek[]>(`/api/eventos-uso/usuario/${encodeURIComponent(userId)}/evolucion`);
  } catch {
    return [];
  }
}

export interface AutonomyCardUsage {
  entidadTipo: string;
  entidadId: string;
  label: string;
  count: number;
}

// Sesion 25 (perfil de memoria): cuales tarjetas de autonomia / frases de
// "no puedo hablar" usa mas esta persona de verdad, para reordenar las
// tarjetas estaticas de AutonomyCards.tsx y CantSpeakMode.tsx. Solo trae
// el campo que estas pantallas necesitan del perfil completo — no vale
// la pena tipar todo /memoria aca para usar un pedacito.
export async function fetchAutonomyCardUsage(userId: string): Promise<AutonomyCardUsage[]> {
  try {
    const profile = await apiRequest<{ autonomyCardUsage: AutonomyCardUsage[] }>(`/api/eventos-uso/usuario/${encodeURIComponent(userId)}/memoria`);
    return profile.autonomyCardUsage || [];
  } catch {
    return [];
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
