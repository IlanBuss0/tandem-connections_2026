import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export type PermissionRow = { key: string; label: string; source: string; checked: boolean; saving: boolean };

type Props = { row: PermissionRow; compact?: boolean; onToggle: (key: string, checked: boolean) => void };

export default function PermissionSwitchRow({ row, compact, onToggle }: Props) {
  return (
    <div className={cn('flex items-center justify-between gap-3 border-t border-[var(--evo-border-3)] first:border-t-0', compact ? 'py-2.5' : 'py-3')}>
      <div className="min-w-0">
        <p className={cn('font-bold text-[var(--evo-text)]', compact ? 'text-[12.5px]' : 'text-[13.5px]')}>{row.label}</p>
        <p className="mt-0.5 text-[11px] text-[var(--evo-text-secondary)]">{row.source}</p>
      </div>
      <Switch
        checked={row.checked}
        disabled={row.saving}
        onCheckedChange={checked => onToggle(row.key, checked)}
        aria-label={row.label}
        className="data-[state=checked]:bg-[var(--evo-primary)] data-[state=unchecked]:bg-[var(--evo-border-2)] focus-visible:ring-[var(--evo-primary)]"
      />
    </div>
  );
}
