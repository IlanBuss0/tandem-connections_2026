// Lista de barras horizontales (emociones, palabras más usadas, comparaciones en %).
export default function HBarList({ items, max, formatValue, highlightFirst = true }: {
  items: { label: string; value: number }[];
  max?: number;
  formatValue?: (value: number) => string;
  highlightFirst?: boolean;
}) {
  const scale = Math.max(1, max ?? Math.max(...items.map(item => item.value), 1));
  const format = formatValue ?? (value => String(value));
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={item.label} className="flex items-center gap-2">
          <span className="w-24 shrink-0 truncate text-xs font-semibold text-[var(--evo-text-secondary)]">{item.label}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--evo-track)]" role="img" aria-label={`${item.label}: ${format(item.value)}`}>
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(100, (item.value / scale) * 100)}%`, background: highlightFirst && index === 0 ? 'var(--evo-primary)' : 'var(--evo-before-bar)' }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-xs font-bold text-[var(--evo-text)]">{format(item.value)}</span>
        </li>
      ))}
    </ul>
  );
}
