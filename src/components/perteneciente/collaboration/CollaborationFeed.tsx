import { useState } from 'react';
import type { SharedSupportAgreement, SharedSupportNote, SharedSupportObjective, SupportNetworkMember } from '@/data/api';
import { buildFeedItems, groupByDay, matchesFilter, type FeedFilter } from './feedHelpers';
import { useAsyncAction } from './useAsyncAction';
import FeedNoteItem from './FeedNoteItem';
import FeedAgreementItem from './FeedAgreementItem';
import FeedObjectiveItem from './FeedObjectiveItem';

const FILTERS: { id: FeedFilter; label: string }[] = [
  { id: 'todo', label: 'Todo' },
  { id: 'nota', label: 'Notas' },
  { id: 'acuerdo', label: 'Acuerdos' },
  { id: 'objetivo', label: 'Objetivos' },
];

export interface CollaborationFeedProps {
  notes: SharedSupportNote[];
  agreements: SharedSupportAgreement[];
  objectives: SharedSupportObjective[];
  supportNetwork: SupportNetworkMember[];
  onDeleteSharedNote?: (noteId: number) => Promise<void>;
  onToggleAgreement?: (agreementId: number, completed: boolean) => Promise<void>;
  onUpdateObjective?: (objectiveId: number, payload: { progreso?: number; estado?: 'activo' | 'pausado' | 'completado' }) => Promise<void>;
}

// Unica responsabilidad: el hilo "Lo que pasó" — junta notas, acuerdos y
// objetivos (feedHelpers.buildFeedItems), filtra y agrupa por día, y delega
// cada tipo de fila en su propio componente.
export default function CollaborationFeed({ notes, agreements, objectives, supportNetwork, onDeleteSharedNote, onToggleAgreement, onUpdateObjective }: CollaborationFeedProps) {
  const [filter, setFilter] = useState<FeedFilter>('todo');
  const { pendingId, error, run } = useAsyncAction();

  const items = buildFeedItems(notes, agreements, objectives).filter(item => matchesFilter(item, filter));
  const groups = groupByDay(items);

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-extrabold text-[var(--evo-text)]">Lo que pasó</h2>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(option => (
          <button
            key={option.id} type="button" aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}
            className={`min-h-11 rounded-full border-2 px-4 text-sm font-bold ${filter === option.id ? 'border-[var(--evo-primary)] bg-[var(--evo-soft)] text-[var(--evo-primary-text)]' : 'border-[var(--evo-border-1)] bg-white text-[var(--evo-text-inactive)]'}`}
          >{option.label}</button>
        ))}
      </div>

      {error && <p role="alert" className="text-xs font-bold text-[var(--evo-support-text)]">No pudimos guardar. Intentá de nuevo.</p>}

      {!groups.length && <p className="rounded-2xl bg-[var(--evo-block)] p-4 text-sm text-[var(--evo-text-secondary)]">Todavía no hay nada para mostrar acá.</p>}

      {groups.map(group => (
        <div key={group.label} className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--evo-text-secondary)]">{group.label}</p>
          {group.items.map(item => {
            if (item.kind === 'nota') {
              return (
                <FeedNoteItem
                  key={`nota-${item.note.id}`} note={item.note}
                  onDelete={onDeleteSharedNote ? noteId => void run(`nota-${noteId}`, () => onDeleteSharedNote(noteId)) : undefined}
                />
              );
            }
            if (item.kind === 'acuerdo') {
              const agreement = item.agreement;
              return (
                <FeedAgreementItem
                  key={`acuerdo-${agreement.id}`} agreement={agreement}
                  creatorName={supportNetwork.find(member => member.id_usuario === agreement.id_usuario_creador)?.nombre}
                  disabled={!onToggleAgreement || pendingId === `acuerdo-${agreement.id}`}
                  onToggle={() => onToggleAgreement && void run(`acuerdo-${agreement.id}`, () => onToggleAgreement(agreement.id, !agreement.completado))}
                />
              );
            }
            const objective = item.objective;
            return (
              <FeedObjectiveItem
                key={`objetivo-${objective.id}`} objective={objective}
                disabled={pendingId === `objetivo-${objective.id}`}
                showButtons={Boolean(onUpdateObjective)}
                onAdjust={delta => onUpdateObjective && void run(`objetivo-${objective.id}`, () => onUpdateObjective(objective.id, { progreso: Math.max(0, Math.min(100, objective.progreso + delta)) }))}
                onComplete={() => onUpdateObjective && void run(`objetivo-${objective.id}`, () => onUpdateObjective(objective.id, { progreso: 100, estado: 'completado' }))}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
