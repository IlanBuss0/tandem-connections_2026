import { useState } from 'react';
import type { RoutineItem } from '@/data/api';

// Unica responsabilidad: mostrar el pictograma de un paso de rutina, o el
// emoji de siempre si no hay uno resuelto (o si la imagen no carga). Nunca
// deja un hueco visual: sin pictograma, el emoji ya esta desde el primer
// frame (no hay spinner ni placeholder que tape la pantalla).
export default function RoutinePictogram({ item, size = 'lg' }: { item: RoutineItem; size?: 'sm' | 'lg' }) {
  const [imageFailed, setImageFailed] = useState(false);
  const dimension = size === 'lg' ? 'h-16 w-16' : 'h-8 w-8';
  const emojiSize = size === 'lg' ? 'text-4xl' : 'text-xl';

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

  return <span className={emojiSize}>{item.icon}</span>;
}
