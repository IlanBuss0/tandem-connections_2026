import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import type { CalendarEvent } from '@/data/api';

// Muestra el pictograma resuelto de un evento. Si todavia no existe o la
// imagen falla, usa un icono neutro de interfaz y nunca vuelve a emojis.
export default function EventPictogram({ event, size = 'md' }: { event: CalendarEvent; size?: 'sm' | 'md' }) {
  const [imageFailed, setImageFailed] = useState(false);
  const dimension = size === 'sm' ? 'h-5 w-5' : 'h-8 w-8';
  useEffect(() => setImageFailed(false), [event.pictogramImageUrl]);

  if (event.pictogramImageUrl && !imageFailed) {
    return (
      <img
        src={event.pictogramImageUrl}
        alt={event.pictogramName ?? event.title}
        className={`${dimension} inline-block object-contain`}
        loading="lazy"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return <CalendarDays className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} inline-block`} aria-hidden />;
}
