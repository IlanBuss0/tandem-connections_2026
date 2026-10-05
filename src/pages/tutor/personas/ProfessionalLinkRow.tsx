import { useId } from 'react';
import { ChevronDown, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import PermissionSwitchRow, { type PermissionRow } from './PermissionSwitchRow';
import PersonAvatar from './PersonAvatar';

type Props = {
  name: string;
  subtitle: string;
  expanded: boolean;
  deleting: boolean;
  rows: PermissionRow[];
  onToggleExpanded: () => void;
  onTogglePermission: (key: string, checked: boolean) => void;
  onDelete: () => void;
};

const ACTION_CLASS = 'flex min-h-11 items-center gap-1.5 rounded-[10px] px-3 text-[11.5px] font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-primary)]';

export default function ProfessionalLinkRow({ name, subtitle, expanded, deleting, rows, onToggleExpanded, onTogglePermission, onDelete }: Props) {
  const panelId = useId();

  return (
    <div className="border-t border-[var(--evo-border-3)] first:border-t-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
        <div className="flex min-w-[10rem] flex-1 items-center gap-3">
          <PersonAvatar name={name} className="h-9 w-9 bg-[var(--evo-info-bg)] text-xs text-[var(--evo-info-text)]" />
          <div className="min-w-0">
            <p className="break-words text-[13.5px] font-extrabold text-[var(--evo-text)]">{name}</p>
            <p className="text-[11.5px] text-[var(--evo-text-secondary)]">{subtitle}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" onClick={onDelete} disabled={deleting} aria-label={`Eliminar vínculo con ${name}`} className={cn(ACTION_CLASS, 'text-destructive disabled:opacity-50')}>
            {deleting ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Trash2 size={14} aria-hidden />}
            Eliminar
          </button>
          <button type="button" aria-expanded={expanded} aria-controls={panelId} onClick={onToggleExpanded} className={cn(ACTION_CLASS, 'bg-[var(--evo-soft-2)] text-[var(--evo-primary-text)]')}>
            {expanded ? 'Ver menos' : 'Ver más'}
            <ChevronDown size={14} className={cn('transition-transform', expanded && 'rotate-180')} aria-hidden />
          </button>
        </div>
      </div>
      {expanded && (
        <div id={panelId} className="mb-3 rounded-[14px] bg-[var(--evo-block)] px-3 py-1.5">
          {rows.map(row => <PermissionSwitchRow key={row.key} row={row} compact onToggle={onTogglePermission} />)}
        </div>
      )}
    </div>
  );
}
