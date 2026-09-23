import { LifeBuoy, Minus, TrendingUp } from 'lucide-react';
import { trendLabel } from './evolutionHelpers';

export default function TrendBadge({ direction }: { direction: 1 | 0 | -1 | null }) {
  if (direction === null) {
    return <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--evo-chip-bg)] px-2.5 py-1 text-[11px] font-bold text-[var(--evo-chip-text)]"><Minus size={12} aria-hidden /> {trendLabel(direction)}</span>;
  }
  if (direction === 1) {
    return <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--evo-good-bg)] px-2.5 py-1 text-[11px] font-bold text-[var(--evo-good-text)]"><TrendingUp size={12} aria-hidden /> {trendLabel(direction)}</span>;
  }
  if (direction === -1) {
    return <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--evo-support-bg)] px-2.5 py-1 text-[11px] font-bold text-[var(--evo-support-text)]"><LifeBuoy size={12} aria-hidden /> {trendLabel(direction)}</span>;
  }
  return <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--evo-info-bg)] px-2.5 py-1 text-[11px] font-bold text-[var(--evo-info-text)]"><Minus size={12} aria-hidden /> {trendLabel(direction)}</span>;
}
