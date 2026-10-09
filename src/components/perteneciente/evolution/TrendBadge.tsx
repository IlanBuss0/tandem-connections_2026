import { LifeBuoy, Minus, TrendingUp } from 'lucide-react';
import { trendLabel } from './evolutionHelpers';

const STYLES = {
  none: { icon: Minus, className: 'bg-[var(--evo-chip-bg)] text-[var(--evo-chip-text)]' },
  up: { icon: TrendingUp, className: 'bg-[var(--evo-good-bg)] text-[var(--evo-good-text)]' },
  down: { icon: LifeBuoy, className: 'bg-[var(--evo-support-bg)] text-[var(--evo-support-text)]' },
  same: { icon: Minus, className: 'bg-[var(--evo-info-bg)] text-[var(--evo-info-text)]' },
};

const styleFor = (direction: 1 | 0 | -1 | null) => STYLES[direction === null ? 'none' : direction === 1 ? 'up' : direction === -1 ? 'down' : 'same'];

// `min-w-0` + `leading-tight`: en tarjetas angostas el texto ("Necesita más apoyo")
// baja a dos líneas en vez de salirse de la tarjeta.
export default function TrendBadge({ direction }: { direction: 1 | 0 | -1 | null }) {
  const { icon: Icon, className } = styleFor(direction);
  return (
    <span className={`flex min-w-0 items-center gap-1 rounded-2xl px-2.5 py-1 text-[11px] font-bold leading-tight ${className}`}>
      <Icon size={12} className="shrink-0" aria-hidden /> {trendLabel(direction)}
    </span>
  );
}
