import { useState } from 'react';
import type { CalendarEvent } from '@/data/api';

// Unica responsabilidad: mostrar el pictograma resuelto de un evento de
// calendario, o el emoji de tipo/categoria de siempre si no hay uno (o si la
// imagen no carga). Mismo patron que RoutinePictogram.tsx, pero el fallback
// de un evento no es un campo propio (los eventos no tienen `icon`): lo
// calcula quien lo use (typeEmoji/getSectionEmoji en UserCalendar) y lo pasa.
export default function EventPictogram({ event, fallbackEmoji }: { event: CalendarEvent; fallbackEmoji: string }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (event.pictogramImageUrl && !imageFailed) {
    return (
      <img
        src={event.pictogramImageUrl}
        alt={event.pictogramName ?? event.title}
        className="h-8 w-8 object-contain"
        loading="lazy"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return <>{fallbackEmoji}</>;
}
