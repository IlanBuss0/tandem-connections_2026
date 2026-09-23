import { LineChart } from 'lucide-react';
import type { EvolutionWeek } from '@/data/usageApi';
import WeeklyLineChart from './WeeklyLineChart';
import RecentActivityCard from './RecentActivityCard';

export default function EvolutionWeekly({ userId, weeks }: { userId: string; weeks: EvolutionWeek[] }) {
  if (weeks.length <= 1) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--evo-border-2)] bg-white p-6 text-center">
        <LineChart size={28} className="text-[var(--evo-primary)]" aria-hidden />
        <p className="mt-3 text-sm font-bold text-[var(--evo-text)]">Todavía no hay datos suficientes para este gráfico.</p>
        <p className="mt-1 text-sm text-[var(--evo-text-secondary)]">Cuando haya más de una semana de registros, lo vas a ver acá.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <WeeklyLineChart id="weekly-steps" title="Pasos de rutina, semana a semana" weeks={weeks} unit="steps" valueOf={week => week.routineCompletions} formatValue={value => String(Math.round(value))} />
      <WeeklyLineChart id="weekly-mood" title="Ánimo positivo, semana a semana" weeks={weeks} unit="mood" lineColor="var(--evo-mood-line)" valueOf={week => (week.positiveEmotionRatio !== null ? week.positiveEmotionRatio * 100 : null)} formatValue={value => `${Math.round(value)}%`} />
      <RecentActivityCard userId={userId} />
    </div>
  );
}
