import { useState } from 'react';
import { Clock3 } from 'lucide-react';
import type { SharedSupportObjective } from '@/data/api';

export default function ObjectiveRow({ objective, disabled, showButtons, onCommit, onComplete }: {
  objective: SharedSupportObjective; disabled: boolean; showButtons: boolean;
  onCommit: (progreso: number) => void; onComplete: () => void;
}) {
  const [value, setValue] = useState(objective.progreso);
  const dirty = value !== objective.progreso;
  const days = Math.floor((Date.now() - new Date(objective.fecha_actualizacion).getTime()) / 86400000);

  return (
    <div className="border-t border-[var(--evo-divider)] py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-extrabold text-[var(--evo-text)]">{objective.titulo}</span>
        <span className="text-base font-extrabold text-[var(--evo-primary)]">{value}%</span>
      </div>
      {showButtons ? (
        <input
          type="range" min={0} max={100} step={5} value={value} disabled={disabled}
          onChange={event => setValue(Number(event.target.value))}
          onPointerUp={() => { if (value !== objective.progreso) onCommit(value); }}
          onKeyUp={() => { if (value !== objective.progreso) onCommit(value); }}
          aria-label={`Progreso de ${objective.titulo}`}
          className="mt-1.5 w-full accent-[var(--evo-primary)]"
        />
      ) : (
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--evo-track)]">
          <div className="h-full rounded-full bg-[var(--evo-primary)]" style={{ width: `${value}%` }} />
        </div>
      )}
      <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--evo-support-text)]">
        <Clock3 size={13} aria-hidden /> Sin cambios hace {days} días
      </div>
      {showButtons && (
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <button type="button" disabled={disabled} onClick={onComplete} className="min-h-9 rounded-xl bg-[var(--evo-soft)] px-3 text-xs font-bold text-[var(--evo-primary-text)] disabled:opacity-50">Completar</button>
          {dirty && (
            <button type="button" disabled={disabled} onClick={() => onCommit(value)} className="min-h-9 rounded-xl bg-[var(--evo-primary)] px-3 text-xs font-bold text-white disabled:opacity-50">Guardar {value}%</button>
          )}
        </div>
      )}
    </div>
  );
}
