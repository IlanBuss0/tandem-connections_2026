import type { EmotionalRecord } from '@/data/api';
import { cn } from '@/lib/utils';
import { MONTHS_SHORT, WEEKDAYS, dayNumber, weekdayIndex } from '@/lib/emotionSummary';

type Props = { day: string; records: EmotionalRecord[] | undefined; selected: boolean; disabled?: boolean; showWeekday?: boolean; onSelect: (day: string) => void };

/** Un día: emoji del último registro (punto gris si no hay), número y «×n» si hubo más de uno. */
export default function EmotionDayButton({ day, records, selected, disabled, showWeekday, onSelect }: Props) {
  const last = records?.[records.length - 1];
  const count = records?.length ?? 0;
  const name = `${WEEKDAYS[weekdayIndex(day)]} ${dayNumber(day)} ${MONTHS_SHORT[Number(day.slice(5, 7)) - 1]}`;
  const summary = count ? `${count} ${count === 1 ? 'registro' : 'registros'}, último: ${last?.emotion}` : 'sin registros';
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${name}, ${summary}`}
      onClick={() => onSelect(day)}
      className={cn(
        'relative flex min-h-[64px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--evo-primary)] disabled:opacity-35',
        selected ? 'border-[var(--evo-primary)] bg-[var(--evo-soft-2)]' : 'border-transparent hover:bg-[var(--evo-soft-2)]',
      )}
    >
      {showWeekday && <span aria-hidden className="text-[11px] font-bold uppercase text-[var(--evo-text-secondary)]">{WEEKDAYS[weekdayIndex(day)][0]}</span>}
      <span aria-hidden className="flex h-7 items-center justify-center text-[22px] leading-none">
        {last ? (last.emoji || '🙂') : <span className="h-2 w-2 rounded-full bg-[#CFC8DB]" />}
      </span>
      <span aria-hidden className="text-[12px] font-extrabold text-[var(--evo-text)]">{dayNumber(day)}</span>
      {count > 1 && <span aria-hidden className="absolute right-1 top-1 rounded-full bg-[var(--evo-primary)] px-1 text-[10px] font-extrabold leading-4 text-white">×{count}</span>}
    </button>
  );
}
