import type { RoutineItem } from '@/data/api';
import PictogramImage from './shared/PictogramImage';

export default function RoutinePictogram({ item, size = 'lg' }: { item: RoutineItem; size?: 'sm' | 'lg' }) {
  const dimension = size === 'lg' ? 'h-16 w-16' : 'h-8 w-8';
  return (
    <PictogramImage
      url={item.pictogramImageUrl}
      alt={item.pictogramName ?? item.title}
      imageClassName={`${dimension} object-contain`}
      fallbackClassName={size === 'lg' ? 'h-8 w-8 text-[#6b4c9a]' : 'h-5 w-5 text-[#6b4c9a]'}
    />
  );
}
