import { useEffect, useRef, useState } from 'react';
import { pictogramizePhrases, type PictogramizedPhrase } from '@/data/api';

// Unica responsabilidad de este hook: resolver un pictograma para el
// TITULO de cada notificacion visible (Sesion 7, item 8 del roadmap). A
// diferencia de useRoutinePictograms/useCalendarPictograms, ESTO NO SE
// PERSISTE: las notificaciones no son un blob editable como una rutina o
// un evento, son un stream de solo lectura. No hace falta persistir
// porque el memo global en BD (Sesion 6) ya evita que un titulo repetido
// ("Nueva actividad recomendada", etc.) vuelva a gastar Groq — el cache
// vive del lado del servidor, no hace falta duplicarlo aca.
//
// Si no hay match (o el texto no tiene apoyo visual claro), la pantalla
// cae al icono de categoria de siempre (TYPE_STYLES) — la regla de "un
// pictograma equivocado es peor que ninguno" sigue vigente.
export function useNotificationPictograms(notifications: { id: string; title: string }[]) {
  const [byTitle, setByTitle] = useState<Map<string, PictogramizedPhrase>>(new Map());
  const resolvedTitlesRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const pendingTitles = new Set<string>();
    for (const n of notifications) {
      const title = n.title?.trim();
      if (title && !resolvedTitlesRef.current.has(title) && !inFlightRef.current.has(title)) {
        pendingTitles.add(title);
      }
    }
    if (pendingTitles.size === 0) return;

    for (const title of pendingTitles) inFlightRef.current.add(title);

    const items = Array.from(pendingTitles).map((title, index) => ({ id: String(index), text: title }));
    pictogramizePhrases(items).then((results) => {
      setByTitle((prev) => {
        const next = new Map(prev);
        for (const result of results) {
          const title = items.find((i) => i.id === result.id)?.text;
          if (title) next.set(title, result);
        }
        return next;
      });
    }).finally(() => {
      for (const title of pendingTitles) {
        resolvedTitlesRef.current.add(title);
        inFlightRef.current.delete(title);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  return byTitle;
}
