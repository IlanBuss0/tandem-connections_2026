import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import type { RoutineItem } from '@/data/api';

// Muestra el pictograma de un paso de rutina. Mientras se resuelve o si la
// imagen falla, deja un icono neutro sin reintroducir el antiguo emoji.
export default function RoutinePictogram({ item, size = 'lg' }: { item: RoutineItem; size?: 'sm' | 'lg' }) {
  const [imageFailed, setImageFailed] = useState(false);
  const dimension = size === 'lg' ? 'h-16 w-16' : 'h-8 w-8';
  useEffect(() => setImageFailed(false), [item.pictogramImageUrl]);

  if (item.pictogramImageUrl && !imageFailed) {
    return (
      <img
        src={item.pictogramImageUrl}
        alt={item.pictogramName ?? item.title}
        className={`${dimension} object-contain`}
        loading="lazy"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return <CalendarDays className={size === 'lg' ? 'h-8 w-8 text-[#6b4c9a]' : 'h-5 w-5 text-[#6b4c9a]'} aria-hidden />;
}
