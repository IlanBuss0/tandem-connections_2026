export default function ListDetailContent({ items, emptyText }: { items: { id: string | number; title: string; date: string }[]; emptyText: string }) {
  if (!items.length) return <p className="text-sm text-[var(--evo-text-secondary)]">{emptyText}</p>;
  return (
    <ul className="space-y-1.5">
      {items.map(item => (
        <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--evo-border-3)] bg-white px-3 py-2">
          <span className="min-w-0 truncate text-sm text-[var(--evo-text)]">{item.title}</span>
          <span className="shrink-0 text-xs text-[var(--evo-text-secondary)]">{item.date}</span>
        </li>
      ))}
    </ul>
  );
}
