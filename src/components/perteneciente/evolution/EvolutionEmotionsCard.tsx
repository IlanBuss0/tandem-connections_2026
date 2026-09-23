import { Heart } from 'lucide-react';
import type { EmotionalRecord } from '@/data/api';
import { emotionCounts } from './evolutionHelpers';
import HBarList from './charts/HBarList';

export interface EmotionPattern { earlier: string; recent: string }

export default function EvolutionEmotionsCard({ emotions, pattern }: { emotions: EmotionalRecord[]; pattern: EmotionPattern | null }) {
  const counts = emotionCounts(emotions);

  return (
    <div className="rounded-3xl border border-[var(--evo-border-1)] bg-white p-4 shadow-[0_12px_32px_rgba(111,76,166,.09),0_2px_6px_rgba(43,33,69,.05)]">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--evo-soft)] text-[var(--evo-primary)]"><Heart size={17} aria-hidden /></span>
        <p className="font-heading text-base font-bold text-[var(--evo-text)]">Emociones</p>
      </div>
      <div className="mt-3 sm:grid sm:grid-cols-2 sm:items-start sm:gap-6">
        {pattern ? (
          <div className="rounded-2xl border border-[var(--evo-border-5)] bg-[var(--evo-block)] p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--evo-primary-text)]"><Heart size={12} aria-hidden /> Patrón emocional</p>
            <p className="mt-1.5 text-sm text-[var(--evo-text-secondary)]">
              {pattern.earlier === pattern.recent
                ? `“${pattern.recent}” sigue siendo la emoción que más se repite, antes y ahora.`
                : `Antes, “${pattern.earlier}” era la emoción que más se repetía. Ahora, “${pattern.recent}” es la más frecuente.`}
            </p>
          </div>
        ) : (
          <p className="rounded-2xl bg-[var(--evo-block)] p-4 text-sm text-[var(--evo-text-secondary)]">Todavía no hay registros emocionales para compartir.</p>
        )}
        {counts.length > 0 && (
          <div className="mt-4 sm:mt-0">
            <p className="mb-2 text-xs font-bold text-[var(--evo-text)]">Las que más se repiten</p>
            <HBarList items={counts.map(c => ({ label: c.emotion, value: c.count }))} formatValue={value => `×${value}`} />
          </div>
        )}
      </div>
    </div>
  );
}
