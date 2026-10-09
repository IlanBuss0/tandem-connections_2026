import type { DayRecords } from '@/lib/emotionSummary';
import { MAX_WEEKS_BACK, weekLabel } from '@/lib/emotionSummary';
import EmotionDayButton from './EmotionDayButton';
import EmotionPeriodNav from './EmotionPeriodNav';

type Props = { days: string[]; offset: number; byDay: DayRecords; selected: string; onSelect: (day: string) => void; onOffset: (offset: number) => void };

export default function EmotionWeekStrip({ days, offset, byDay, selected, onSelect, onOffset }: Props) {
  return (
    <EmotionPeriodNav label={weekLabel(days, offset)} unit="semana" canPrev={offset < MAX_WEEKS_BACK} canNext={offset > 0} onPrev={() => onOffset(offset + 1)} onNext={() => onOffset(offset - 1)}>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map(day => <EmotionDayButton key={day} day={day} records={byDay[day]} selected={day === selected} showWeekday onSelect={onSelect} />)}
      </div>
    </EmotionPeriodNav>
  );
}
