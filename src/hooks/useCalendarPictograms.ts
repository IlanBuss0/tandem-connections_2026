import { useEffect, useRef, useState } from 'react';
import { pictogramizePhrases } from '@/data/api';
import { useCalendar } from '@/contexts/CalendarContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';

// Unica responsabilidad de este hook: para los eventos de calendario que
// todavia no tienen pictograma resuelto, resolverlos en UNA sola llamada al
// motor de pictogramizacion (Sesion 1) y guardarlos. Mismo patron que
// useRoutinePictograms.ts, aplicado a CalendarEvent en vez de RoutineItem
// (Sesion 3: "traducir calendario").
//
// `pictogramResolvedFor` es la unica defensa real contra quemar la cuota
// diaria de Groq (Redis esta apagado, cacheService es no-op): mientras
// coincida con `event.title`, el evento ya se intento y no se vuelve a
// pedir, aunque el resultado haya sido "sin pictograma".
//
// Por que no se cancela la resolucion cuando `events` cambia de referencia
// a mitad de camino: CalendarContext hace un fetchEvents() completo despues
// de CADA mutacion (crear, editar, borrar cualquier evento), lo que renueva
// el array `events` mucho antes de que Groq responda. Cancelar ahi (como
// hace useRoutinePictograms con su `routine.items`) tira el resultado ya
// resuelto sin guardarlo. La deduplicacion real ya la hace `inFlightRef`
// (un id en vuelo no vuelve a pedirse), asi que solo hace falta frenar en
// el desmonte del componente, no en cada cambio de props.
export function useCalendarPictograms(events: { id: string; title: string; pictogramResolvedFor?: string }[]) {
  const { updateEvent } = useCalendar();
  const { settings } = useAccessibility();
  const preferredStyleOverride = settings.highContrastPictograms ? 'alto-contraste' : undefined;
  const [resolving, setResolving] = useState(false);
  const inFlightRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => {
    const pending = events.filter(
      (event) => event.title.trim() && event.pictogramResolvedFor !== event.title && !inFlightRef.current.has(event.id),
    );
    if (pending.length === 0) return;

    for (const event of pending) inFlightRef.current.add(event.id);
    setResolving(true);

    pictogramizePhrases(pending.map((event) => ({ id: event.id, text: event.title })), { preferredStyleOverride })
      .then((results) => {
        if (!mountedRef.current) return;
        for (const result of results) {
          const event = pending.find((p) => p.id === result.id);
          if (!event) continue;

          if (result.pictogram) {
            updateEvent(event.id, {
              pictogramId: result.pictogram.id,
              pictogramImageUrl: result.pictogram.imageUrl,
              pictogramName: result.pictogram.name,
              pictogramConfidence: result.confidence === 'alta' || result.confidence === 'media' ? result.confidence : undefined,
              pictogramResolvedFor: event.title,
            });
          } else {
            updateEvent(event.id, { pictogramResolvedFor: event.title });
          }
        }
      })
      .finally(() => {
        for (const event of pending) inFlightRef.current.delete(event.id);
        if (mountedRef.current) setResolving(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  return { resolving };
}
