// Columnas verticales de comparación (Antes/Ahora o varias semanas). Escala desde 0.
export default function BarColumns({ values, labels, highlightLast = true, showValues = true }: {
  values: number[]; labels: string[]; highlightLast?: boolean; showValues?: boolean;
}) {
  const max = Math.max(1, ...values);
  const label = `${labels.map((l, i) => `${l}: ${values[i]}`).join(', ')}`;
  return (
    <div className="flex h-20 items-end gap-2" role="img" aria-label={label}>
      {values.map((value, index) => {
        const isLast = highlightLast && index === values.length - 1;
        return (
          <div key={labels[index] ?? index} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            {showValues && <span className="text-[11px] font-bold text-[var(--evo-text)]">{value}</span>}
            <div className="flex h-14 w-full items-end overflow-hidden rounded-full bg-[var(--evo-track)]">
              <div
                className="w-full rounded-full"
                style={{ height: `${Math.max(6, (value / max) * 100)}%`, background: isLast ? 'var(--evo-primary)' : 'var(--evo-before-bar)' }}
              />
            </div>
            <span className="truncate text-[10px] font-semibold text-[var(--evo-text-secondary)]">{labels[index]}</span>
          </div>
        );
      })}
    </div>
  );
}
