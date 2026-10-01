import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

const arrowClass = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--evo-border-1)] bg-white text-[var(--evo-primary-text)] transition-colors hover:bg-[var(--evo-soft-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-primary)] disabled:opacity-40 disabled:hover:bg-white';

type Props = { label: string; unit: 'semana' | 'mes'; canPrev: boolean; canNext: boolean; onPrev: () => void; onNext: () => void; children: ReactNode };

/** Tarjeta con flechas ← → y la etiqueta del período; el contenido (semana o mes) va adentro. */
export default function EmotionPeriodNav({ label, unit, canPrev, canNext, onPrev, onNext, children }: Props) {
  return (
    <section className="rounded-[24px] border border-[#ece3f8] bg-white p-3.5 shadow-[0_8px_24px_#f0e8f8] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button type="button" onClick={onPrev} disabled={!canPrev} aria-label={unit === 'semana' ? 'Semana anterior' : 'Mes anterior'} className={arrowClass}><ChevronLeft size={20} aria-hidden /></button>
        <h3 aria-live="polite" className="text-center text-[15px] font-extrabold capitalize text-[var(--evo-text)]">{label}</h3>
        <button type="button" onClick={onNext} disabled={!canNext} aria-label={unit === 'semana' ? 'Semana siguiente' : 'Mes siguiente'} className={arrowClass}><ChevronRight size={20} aria-hidden /></button>
      </div>
      {children}
    </section>
  );
}
