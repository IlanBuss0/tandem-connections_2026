import { useState } from 'react';
import { Check, Target } from 'lucide-react';
import type { SharedSupportObjective } from '@/data/api';
import { relativeDays } from './collaborationHelpers';
import { isToday, shortDate } from './feedHelpers';

export default function FeedObjectiveItem({ objective, disabled, showButtons, onCommit, onComplete }: {
  objective: SharedSupportObjective; disabled: boolean; showButtons: boolean;
  onCommit: (progreso: number) => void; onComplete: () => void;
}) {
  const [value, setValue] = useState(objective.progreso);
  const dirty = value !== objective.progreso;

  if (objective.estado === 'completado') {
    return (
      <div className="flex items-center gap-3 rounded-[24px] border border-[var(--evo-border-1)] bg-white p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--evo-good-bg)] text-[var(--evo-good-text)]"><Target size={16} aria-hidden /></span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--evo-text)]">Objetivo completado</p>
          <p className="mt-0.5 text-xs text-[var(--evo-text-secondary)]">{objective.titulo} · {shortDate(objective.fecha_actualizacion)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-[var(--evo-border-1)] bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm font-extrabold text-[var(--evo-text)]">
          {objective.titulo}
          {isToday(objective.fecha_actualizacion) && <span className="rounded-full bg-[var(--evo-good-bg)] px-2 py-0.5 text-[11px] font-extrabold text-[var(--evo-good-text)]">Nuevo</span>}
        </span>
        <span className="shrink-0 text-base font-extrabold text-[var(--evo-primary)]">{value}%</span>
      </div>
      <p className="mt-0.5 text-xs text-[var(--evo-text-secondary)]">Actualizado {relativeDays(objective.fecha_actualizacion)}{objective.autor_nombre ? ` · lo puso ${objective.autor_nombre}` : ''}</p>
      {showButtons ? (
        <input
          type="range" min={0} max={100} step={5} value={value} disabled={disabled}
          onChange={event => setValue(Number(event.target.value))}
          onPointerUp={() => { if (value !== objective.progreso) onCommit(value); }}
          onKeyUp={() => { if (value !== objective.progreso) onCommit(value); }}
          aria-label={`Progreso de ${objective.titulo}`}
          className="mt-2 w-full accent-[var(--evo-primary)]"
        />
      ) : (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--evo-track)]">
          <div className="h-full rounded-full bg-[var(--evo-primary)]" style={{ width: `${value}%` }} />
        </div>
      )}
      {showButtons && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" disabled={disabled} onClick={onComplete} className="flex min-h-9 items-center gap-1.5 rounded-xl bg-[var(--evo-soft)] px-3 text-xs font-bold text-[var(--evo-primary-text)] disabled:opacity-50">
            <Check size={13} aria-hidden /> Completar
          </button>
          {dirty && (
            <button type="button" disabled={disabled} onClick={() => onCommit(value)} className="min-h-9 rounded-xl bg-[var(--evo-primary)] px-3 text-xs font-bold text-white disabled:opacity-50">Guardar {value}%</button>
          )}
        </div>
      )}
    </div>
  );
}
