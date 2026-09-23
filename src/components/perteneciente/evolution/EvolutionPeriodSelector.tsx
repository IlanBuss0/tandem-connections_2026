import { Check } from 'lucide-react';

export type Period = 'month' | 'quarter';

const OPTIONS: { id: Period; label: string }[] = [
  { id: 'month', label: 'Este mes' },
  { id: 'quarter', label: 'Últimos 3 meses' },
];

export default function EvolutionPeriodSelector({ period, onChange }: { period: Period; onChange: (period: Period) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-[var(--evo-text-secondary)]">Período</p>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map(option => {
          const active = option.id === period;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.id)}
              className={`flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-bold transition ${active ? 'border-[var(--evo-primary)] bg-white text-[var(--evo-primary)]' : 'border-[var(--evo-border-2)] bg-white text-[var(--evo-text-secondary)]'}`}
            >
              {active && <Check size={15} aria-hidden />} {option.label}
            </button>
          );
        })}
      </div>
      {period === 'quarter' && <p className="mt-2 text-xs text-[var(--evo-text-secondary)]">Comparamos los últimos 3 meses con los 3 anteriores.</p>}
    </div>
  );
}
