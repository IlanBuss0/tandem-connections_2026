import type { CalendarEvent, EmotionalRecord } from '@/data/api';

// Unica responsabilidad: armar el mensaje de "ya hiciste esto antes"
// (Sesion 16, item 19 ⭐ — el mas fuerte del bloque de anticipacion). Puro:
// recibe los eventos pasados del mismo tipo y los registros emocionales,
// no sabe de donde salieron.
//
// Regla de honestidad (la misma que rige todo el motor de pictogramas,
// aplicada aca): si no hay datos suficientes, no se inventa una
// conclusion tranquilizadora falsa. Sin eventos pasados del mismo tipo,
// no hay mensaje — es mejor no decir nada que decir "ya fuiste 0 veces" o
// peor, afirmar que "siempre salio bien" sin tener con que respaldarlo.
const POSITIVE_EMOTIONS = new Set(['Contento', 'Feliz', 'Tranquilo', 'Motivado', 'Orgulloso']);

export function buildReassuranceMessage(pastEventsOfSameType: CalendarEvent[], emotionRecords: EmotionalRecord[]): string | null {
  if (pastEventsOfSameType.length === 0) return null;

  const count = pastEventsOfSameType.length;
  const base = `Ya hiciste esto antes: ${count} ${count === 1 ? 'vez' : 'veces'}.`;

  // Emociones registradas el mismo dia que un evento pasado de este tipo,
  // como pista (no prueba) de como fue.
  const pastDates = new Set(pastEventsOfSameType.map((e) => e.date));
  const relatedEmotions = emotionRecords.filter((r) => pastDates.has(r.date));

  if (relatedEmotions.length === 0) return base;

  const positiveCount = relatedEmotions.filter((r) => POSITIVE_EMOTIONS.has(r.emotion)).length;
  const positiveRatio = positiveCount / relatedEmotions.length;

  if (positiveRatio >= 0.6) {
    return `${base} Las veces que registraste cómo te sentiste después, en general te fue bien.`;
  }
  return base;
}
