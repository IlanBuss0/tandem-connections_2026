import type { EmotionalRecord, ProfessionalSession } from '@/data/api';
import type { UsageEventRecord } from '@/data/usageApi';

/** Lo ocurrido desde la última sesión completada (sin sesión completada, desde siempre). */
export function sinceLastSession(sessions: ProfessionalSession[], events: UsageEventRecord[], emotions: EmotionalRecord[]) {
  const last = [...sessions].sort((a, b) => b.fecha_sesion.localeCompare(a.fecha_sesion)).find(session => session.estado === 'completada');
  const since = last ? new Date(last.fecha_sesion).getTime() : 0;
  return {
    last,
    since,
    recentEvents: events.filter(event => new Date(event.ocurrido_en).getTime() >= since),
    recentEmotions: emotions.filter(emotion => new Date(emotion.date).getTime() >= since),
  };
}
