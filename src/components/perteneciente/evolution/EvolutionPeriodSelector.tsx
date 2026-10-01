import { Check } from 'lucide-react';
import { PERIODS, PERIOD_CONFIG, type Period } from './evolutionPeriods';

export default function EvolutionPeriodSelector({ period, onChange }: { period: Period; onChange: (period: Period) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-[var(--evo-text-secondary)]">Período</p>
      <div className="flex flex-wrap gap-2">
        {PERIODS.map(id => {
          const active = id === period;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(id)}
              className={`flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--evo-primary)] ${active ? 'border-[var(--evo-primary)] bg-white text-[var(--evo-primary)]' : 'border-[var(--evo-border-2)] bg-white text-[var(--evo-text-secondary)]'}`}
            >
              {active && <Check size={15} aria-hidden />} {PERIOD_CONFIG[id].label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-[var(--evo-text-secondary)]">{PERIOD_CONFIG[period].hint}</p>
    </div>
  );
}
