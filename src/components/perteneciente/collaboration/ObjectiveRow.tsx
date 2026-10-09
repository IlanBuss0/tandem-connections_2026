import { Clock3 } from 'lucide-react';
import type { SharedSupportObjective } from '@/data/api';
import ObjectiveProgressEditor from './ObjectiveProgressEditor';

export default function ObjectiveRow({ objective, disabled, showButtons, onCommit, onComplete }: {
  objective: SharedSupportObjective; disabled: boolean; showButtons: boolean;
  onCommit: (progreso: number) => void; onComplete: () => void;
}) {
  const days = Math.floor((Date.now() - new Date(objective.fecha_actualizacion).getTime()) / 86400000);
  return (
    <ObjectiveProgressEditor
      objective={objective} disabled={disabled} showButtons={showButtons}
      onCommit={onCommit} onComplete={onComplete} variant="row"
      header={value => (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-extrabold text-[var(--evo-text)]">{objective.titulo}</span>
          <span className="text-base font-extrabold text-[var(--evo-primary)]">{value}%</span>
        </div>
      )}
      metadata={<div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--evo-support-text)]">
        <Clock3 size={13} aria-hidden /> Sin cambios hace {days} d?as
      </div>}
    />
  );
}
