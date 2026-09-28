import { cn } from '@/lib/utils';

export default function PersonAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  return (
    <span aria-hidden className={cn('flex shrink-0 items-center justify-center rounded-full font-bold', className)}>
      {initials}
    </span>
  );
}
