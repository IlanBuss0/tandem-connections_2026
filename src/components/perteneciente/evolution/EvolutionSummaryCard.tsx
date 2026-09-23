import { LifeBuoy, Minus, TrendingUp } from 'lucide-react';
import type { OverviewSummary } from './evolutionHelpers';

export default function EvolutionSummaryCard({ summary }: { summary: OverviewSummary }) {
  const total = summary.good + summary.same + summary.support;
  const segments = [
    { key: 'good', count: summary.good, color: 'var(--evo-good)' },
    { key: 'same', count: summary.same, color: 'var(--evo-info)' },
    { key: 'support', count: summary.support, color: 'var(--evo-support)' },
  ].filter(segment => segment.count > 0);

  return (
    <div className="rounded-3xl border border-[var(--evo-border-3)] bg-[var(--evo-soft-2)] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[var(--evo-primary-text)]">{summary.eyebrow}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--evo-text)]">{summary.phrase}</p>
      {total > 0 && (
        <div
          role="img"
          aria-label={`${summary.legend.good}, ${summary.legend.same}, ${summary.legend.support}`}
          className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--evo-track)]"
        >
          {segments.map(segment => (
            <span key={segment.key} style={{ width: `${(segment.count / total) * 100}%`, background: segment.color }} />
          ))}
        </div>
      )}
      {total > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-semibold text-[var(--evo-text-secondary)]">
          {summary.good > 0 && <li className="flex items-center gap-1"><TrendingUp size={13} className="text-[var(--evo-good-text)]" aria-hidden /> {summary.legend.good}</li>}
          {summary.same > 0 && <li className="flex items-center gap-1"><Minus size={13} className="text-[var(--evo-info-text)]" aria-hidden /> {summary.legend.same}</li>}
          {summary.support > 0 && <li className="flex items-center gap-1"><LifeBuoy size={13} className="text-[var(--evo-support-text)]" aria-hidden /> {summary.legend.support}</li>}
        </ul>
      )}
    </div>
  );
}
