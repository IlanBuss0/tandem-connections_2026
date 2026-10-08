import { useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import type { SharedSupportObjective } from '@/data/api';

type ObjectiveProgressEditorProps = {
  objective: SharedSupportObjective;
  disabled: boolean;
  showButtons: boolean;
  onCommit: (progress: number) => void;
  onComplete: () => void;
  variant: 'row' | 'feed';
  header: (value: number) => ReactNode;
  metadata: ReactNode;
};

export default function ObjectiveProgressEditor({
  objective, disabled, showButtons, onCommit, onComplete, variant, header, metadata,
}: ObjectiveProgressEditorProps) {
  const [value, setValue] = useState(objective.progreso);
  const dirty = value !== objective.progreso;
  const isFeed = variant === 'feed';
  const commitIfDirty = () => { if (value !== objective.progreso) onCommit(value); };
  return (
    <div className={isFeed
      ? 'rounded-[24px] border border-[var(--evo-border-1)] bg-white p-4'
      : 'border-t border-[var(--evo-divider)] py-3'}>
      {header(value)}
      {isFeed && metadata}
      {showButtons ? (
        <input
          type="range" min={0} max={100} step={5} value={value} disabled={disabled}
          onChange={event => setValue(Number(event.target.value))}
          onPointerUp={commitIfDirty} onKeyUp={commitIfDirty}
          aria-label={`Progreso de ${objective.titulo}`}
          className={`${isFeed ? 'mt-2' : 'mt-1.5'} w-full accent-[var(--evo-primary)]`}
        />
      ) : (
        <div className={`${isFeed ? 'mt-2' : 'mt-1.5'} h-2 overflow-hidden rounded-full bg-[var(--evo-track)]`}>
          <div className="h-full rounded-full bg-[var(--evo-primary)]" style={{ width: `${value}%` }} />
        </div>
      )}
      {!isFeed && metadata}
      {showButtons && (
        <div className={`${isFeed ? 'mt-3' : 'mt-3.5'} flex flex-wrap items-center gap-2`}>
          <button type="button" disabled={disabled} onClick={onComplete} className={isFeed
            ? 'flex min-h-9 items-center gap-1.5 rounded-xl bg-[var(--evo-soft)] px-3 text-xs font-bold text-[var(--evo-primary-text)] disabled:opacity-50'
            : 'min-h-9 rounded-xl bg-[var(--evo-soft)] px-3 text-xs font-bold text-[var(--evo-primary-text)] disabled:opacity-50'}>
            {isFeed && <Check size={13} aria-hidden />}Completar
          </button>
          {dirty && (
            <button type="button" disabled={disabled} onClick={() => onCommit(value)} className="min-h-9 rounded-xl bg-[var(--evo-primary)] px-3 text-xs font-bold text-white disabled:opacity-50">
              Guardar {value}%
            </button>
          )}
        </div>
      )}
    </div>
  );
}
