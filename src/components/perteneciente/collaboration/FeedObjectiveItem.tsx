import { Target } from 'lucide-react';
import type { SharedSupportObjective } from '@/data/api';
import { relativeDays } from './collaborationHelpers';
import { isToday, shortDate } from './feedHelpers';
import ObjectiveProgressEditor from './ObjectiveProgressEditor';

export default function FeedObjectiveItem({ objective, disabled, showButtons, onCommit, onComplete }: {
  objective: SharedSupportObjective; disabled: boolean; showButtons: boolean;
  onCommit: (progreso: number) => void; onComplete: () => void;
}) {
  if (objective.estado === 'completado') {
    return (
      <div className="flex items-center gap-3 rounded-[24px] border border-[var(--evo-border-1)] bg-white p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--evo-good-bg)] text-[var(--evo-good-text)]"><Target size={16} aria-hidden /></span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--evo-text)]">Objetivo completado</p>
          <p className="mt-0.5 text-xs text-[var(--evo-text-secondary)]">{objective.titulo} ? {shortDate(objective.fecha_actualizacion)}</p>
        </div>
      </div>
    );
  }
  return (
    <ObjectiveProgressEditor
      objective={objective} disabled={disabled} showButtons={showButtons}
      onCommit={onCommit} onComplete={onComplete} variant="feed"
      header={value => (
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm font-extrabold text-[var(--evo-text)]">
            {objective.titulo}
            {isToday(objective.fecha_actualizacion) && <span className="rounded-full bg-[var(--evo-good-bg)] px-2 py-0.5 text-[11px] font-extrabold text-[var(--evo-good-text)]">Nuevo</span>}
          </span>
          <span className="shrink-0 text-base font-extrabold text-[var(--evo-primary)]">{value}%</span>
        </div>
      )}
      metadata={<p className="mt-0.5 text-xs text-[var(--evo-text-secondary)]">
        Actualizado {relativeDays(objective.fecha_actualizacion)}{objective.autor_nombre ? ` ? lo puso ${objective.autor_nombre}` : ''}
      </p>}
    />
  );
}
