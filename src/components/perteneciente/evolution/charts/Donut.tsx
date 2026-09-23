// Anillo de porcentaje con etiqueta central (vocabulario, patrones).
export default function Donut({ percent, centerLabel, label }: { percent: number; centerLabel: string; label: string }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="relative inline-flex h-20 w-20 items-center justify-center" role="img" aria-label={label}>
      <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="var(--evo-track)" strokeWidth="8" />
        <circle
          cx="40" cy="40" r={radius} fill="none" stroke="var(--evo-ring-support)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute text-xs font-bold text-[var(--evo-text)]">{centerLabel}</span>
    </div>
  );
}
