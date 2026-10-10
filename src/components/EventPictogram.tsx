import type { CalendarEvent } from '@/data/api';
import PictogramImage from './shared/PictogramImage';

export default function EventPictogram({ event, size = 'md' }: { event: CalendarEvent; size?: 'sm' | 'md' }) {
  const dimension = size === 'sm' ? 'h-5 w-5' : 'h-8 w-8';
  return (
    <PictogramImage
      url={event.pictogramImageUrl}
      alt={event.pictogramName ?? event.title}
      imageClassName={`${dimension} inline-block object-contain`}
      fallbackClassName={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} inline-block`}
    />
  );
}
