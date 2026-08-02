import type { CalendarEvent } from '@/data/api';
import { formatConcreteDays } from '@/lib/concreteTime';

// Unica responsabilidad: armar las frases de una historia social a partir
// de un evento de calendario (Sesion 15, item 17). Puro — no llama a
// Groq ni a nada; solo arma el texto. Quien la use manda estas frases a
// pictogramizePhrases (el motor ya existente de la Sesion 1) para
// traducirlas a pictogramas.
//
// Plantilla fija a proposito: una historia social de CAA sigue una
// estructura predecible (que va a pasar, cuando, que va a pasar en el
// momento, como termina) — la previsibilidad de la ESTRUCTURA es parte de
// por que las historias sociales ayudan. No hace falta IA para esto, y
// generarla con Groq introduciria variabilidad que no suma.
export function buildSocialStoryPhrases(event: CalendarEvent, now: Date): string[] {
  const phrases: string[] = [];

  phrases.push(`Vamos a ${event.title}`);
  phrases.push(`Es ${formatConcreteDays(event.date, now)}, a las ${event.time}`);

  if (event.description?.trim()) {
    phrases.push(event.description.trim());
  }

  phrases.push('Puedo estar tranquilo, ya sé lo que va a pasar');

  if (event.afterNote?.trim()) {
    phrases.push(`Al final: ${event.afterNote.trim()}`);
  } else {
    phrases.push('Después volvemos a casa');
  }

  return phrases;
}
