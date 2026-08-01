import { useEffect, useRef, useState } from 'react';
import { pictogramizePhrases } from '@/data/api';
import { useRoutines, type DayRoutine } from '@/contexts/RoutinesContext';

// Unica responsabilidad de este hook: para la rutina que se esta mirando,
// resolver el pictograma de cada paso que todavia no lo tiene, en UNA sola
// llamada al motor de pictogramizacion (backend). No sabe nada de como se
// renderiza (eso es RoutinePictogram.tsx) ni de scoring (eso es
// PictogramizationService en el backend).
//
// Por que "resolvedFor" en vez de recalcular siempre: Redis esta apagado en
// el backend (cacheService es no-op), asi que la unica defensa real contra
// quemar la cuota diaria de Groq es la persistencia. `pictogramResolvedFor`
// se guarda en cada RoutineItem (ver mockData.ts) y el autosave de
// RoutinesContext lo persiste solo. Si coincide con `item.title`, el paso ya
// se intento (aunque el resultado haya sido "sin pictograma") y no se vuelve
// a pedir.
export function useRoutinePictograms(routine: DayRoutine | null) {
  const { updateItem } = useRoutines();
  const [resolving, setResolving] = useState(false);
  const inFlightRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!routine) return;

    const pending = routine.items.filter(
      (item) => item.title.trim() && item.pictogramResolvedFor !== item.title && !inFlightRef.current.has(item.id),
    );
    if (pending.length === 0) return;

    for (const item of pending) inFlightRef.current.add(item.id);
    setResolving(true);

    let cancelled = false;
    pictogramizePhrases(pending.map((item) => ({ id: item.id, text: item.title })))
      .then((results) => {
        if (cancelled) return;
        for (const result of results) {
          const item = pending.find((p) => p.id === result.id);
          if (!item) continue;

          if (result.pictogram) {
            updateItem(routine.id, item.id, {
              pictogramId: result.pictogram.id,
              pictogramImageUrl: result.pictogram.imageUrl,
              pictogramName: result.pictogram.name,
              pictogramConfidence: result.confidence === 'alta' || result.confidence === 'media' ? result.confidence : undefined,
              pictogramResolvedFor: item.title,
            });
          } else {
            // Sin certeza suficiente: se marca "ya intentado" y listo. La UI
            // cae al emoji que el paso ya tenia, sin marca ni aviso.
            updateItem(routine.id, item.id, { pictogramResolvedFor: item.title });
          }
        }
      })
      .finally(() => {
        if (cancelled) return;
        for (const item of pending) inFlightRef.current.delete(item.id);
        setResolving(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routine?.id, routine?.items]);

  return { resolving };
}
