import type { LucideIcon } from 'lucide-react';
import Sparkline from './charts/Sparkline';
import BarColumns from './charts/BarColumns';
import TrendBadge from './TrendBadge';

export interface EvolutionMetricCardProps {
  icon: LucideIcon;
  title: string;
  value: number | null;
  previousLabel: string | null;
  unit: string;
  direction: 1 | 0 | -1 | null;
  sparklineValues?: number[];
  barColumns?: { values: number[]; labels: string[] };
  beforeText: string;
  afterText: string;
  spanFull?: boolean;
  onOpen: () => void;
}

export default function EvolutionMetricCard({
  icon: Icon, title, value, previousLabel, unit, direction, sparklineValues, barColumns, beforeText, afterText, spanFull, onOpen,
}: EvolutionMetricCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex min-h-11 flex-col rounded-3xl border border-[var(--evo-border-1)] bg-white p-4 text-left shadow-[0_12px_32px_rgba(111,76,166,.09),0_2px_6px_rgba(43,33,69,.05)] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evo-primary)] ${spanFull ? 'col-span-2 lg:col-span-1' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--evo-soft)] text-[var(--evo-primary)]"><Icon size={17} aria-hidden /></span>
        <TrendBadge direction={direction} />
      </div>
      <p className="mt-2 min-h-9 truncate text-sm font-bold text-[var(--evo-text)]">{title}</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="font-heading text-2xl font-bold text-[var(--evo-text)]">{value === null ? '—' : value}</span>
        {value !== null && <span className="text-xs font-semibold text-[var(--evo-text-secondary)]">{unit}</span>}
      </p>
      {previousLabel && <p className="text-xs text-[var(--evo-text-secondary)]">{previousLabel}</p>}
      {value !== null && sparklineValues && sparklineValues.length > 1 && (
        <div className="mt-2"><Sparkline values={sparklineValues} label={`${title}: evolución semanal`} /></div>
      )}
      {value !== null && barColumns && (
        <div className="mt-2"><BarColumns values={barColumns.values} labels={barColumns.labels} showValues={false} /></div>
      )}
      <span className="sr-only">{beforeText} {afterText}</span>
    </button>
  );
}
