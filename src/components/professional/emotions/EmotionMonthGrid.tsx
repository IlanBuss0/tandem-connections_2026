import type { DayRecords } from '@/lib/emotionSummary';
import { MAX_MONTHS_BACK, monthCells } from '@/lib/emotionSummary';
import EmotionDayButton from './EmotionDayButton';
import EmotionPeriodNav from './EmotionPeriodNav';

const HEADERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

type Props = { days: string[]; label: string; today: string; offset: number; byDay: DayRecords; selected: string; onSelect: (day: string) => void; onOffset: (offset: number) => void };

export default function EmotionMonthGrid({ days, label, today, offset, byDay, selected, onSelect, onOffset }: Props) {
  return (
    <EmotionPeriodNav label={label} unit="mes" canPrev={offset < MAX_MONTHS_BACK} canNext={offset > 0} onPrev={() => onOffset(offset + 1)} onNext={() => onOffset(offset - 1)}>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {HEADERS.map((letter, index) => <span key={index} aria-hidden className="pb-1 text-center text-[11px] font-bold uppercase text-[var(--evo-text-secondary)]">{letter}</span>)}
        {monthCells(days).map((day, index) => day
          ? <EmotionDayButton key={day} day={day} records={byDay[day]} selected={day === selected} disabled={day > today} onSelect={onSelect} />
          : <span key={`gap-${index}`} aria-hidden />)}
      </div>
    </EmotionPeriodNav>
  );
}
