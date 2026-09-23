import { useState } from 'react';
import { ChevronRight, FileText } from 'lucide-react';
import type { EvolutionWeek } from '@/data/usageApi';
import type { EvolutionChangeCard } from './buildEvolutionExport';
import EvolutionShareSheet from './EvolutionShareSheet';

export interface EvolutionShareCardProps {
  personName: string;
  userId: string;
  weeks: EvolutionWeek[];
  summaryPhrase: string;
  cards: EvolutionChangeCard[];
}

export default function EvolutionShareCard({ personName, userId, weeks, summaryPhrase, cards }: EvolutionShareCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-3xl border border-[var(--evo-border-1)] bg-[var(--evo-soft-2)] p-4 text-left shadow-[0_12px_32px_rgba(111,76,166,.09),0_2px_6px_rgba(43,33,69,.05)] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--evo-primary)]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--evo-soft)] text-[var(--evo-primary)]"><FileText size={18} aria-hidden /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-heading text-base font-bold text-[var(--evo-text)]">Llevar un resumen</span>
          <span className="block text-sm text-[var(--evo-text-secondary)]">Armalo para conversar en una sesión.</span>
        </span>
        <ChevronRight size={18} className="shrink-0 text-[var(--evo-text-secondary)]" aria-hidden />
      </button>
      <EvolutionShareSheet open={open} onClose={() => setOpen(false)} personName={personName} userId={userId} weeks={weeks} summaryPhrase={summaryPhrase} cards={cards} />
    </>
  );
}
