import { useState } from 'react';
import { ChevronDown, Shield } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import PermissionSwitchRow, { type PermissionRow } from './PermissionSwitchRow';
import SurfaceCard from './SurfaceCard';

const VISIBLE_COUNT = 6;

export default function PersonPermissionsCard({ rows, onToggle }: { rows: PermissionRow[]; onToggle: (key: string, checked: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const extra = rows.slice(VISIBLE_COUNT);

  return (
    <SurfaceCard>
      <div className="mb-1 flex items-center justify-between gap-2.5">
        <h2 className="flex min-w-0 items-center gap-2.5 text-[15.5px] font-extrabold text-[var(--evo-text)]">
          <Shield size={18} className="shrink-0 text-[var(--evo-primary)]" aria-hidden />
          Tus permisos
        </h2>
        {extra.length > 0 && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-[10px] bg-[var(--evo-soft-2)] px-3 text-[11.5px] font-extrabold text-[var(--evo-primary-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-primary)]"
              >
                {open ? 'Ocultar' : `Ver más (${extra.length})`}
                <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} aria-hidden />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="evolution-scope w-[250px] rounded-[18px] border-[var(--evo-border-1)] bg-white px-3.5 py-2.5 shadow-[0_16px_34px_rgba(43,33,69,.18)]">
              <p className="mb-1 mt-0.5 text-[11px] font-extrabold uppercase tracking-[.06em] text-[var(--evo-text-secondary)]">Más permisos</p>
              {extra.map(row => <PermissionSwitchRow key={row.key} row={row} compact onToggle={onToggle} />)}
            </PopoverContent>
          </Popover>
        )}
      </div>
      {rows.slice(0, VISIBLE_COUNT).map(row => <PermissionSwitchRow key={row.key} row={row} onToggle={onToggle} />)}
    </SurfaceCard>
  );
}
