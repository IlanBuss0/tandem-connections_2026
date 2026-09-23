import { CheckCircle2, ClipboardPlus, ListChecks, Smile, Target, Users } from 'lucide-react';
import type { EmotionalRecord } from '@/data/api';
import type { EvolutionWeek } from '@/data/usageApi';
import { buildOverviewSummary, trendDirection } from './evolutionHelpers';
import EvolutionSummaryCard from './EvolutionSummaryCard';
import EvolutionMetricCard, { type EvolutionMetricCardProps } from './EvolutionMetricCard';
import EvolutionEmotionsCard, { type EmotionPattern } from './EvolutionEmotionsCard';
import EvolutionShareCard from './EvolutionShareCard';
import type { DetailKind } from './EvolutionDetailSheet';

export interface EvolutionOverviewProps {
  personName: string;
  userId: string;
  canViewHistory: boolean;
  autonomyLabel: string;
  weeks: EvolutionWeek[];
  recentSteps: number | null; earlierSteps: number | null;
  recentMood: number | null; earlierMood: number | null;
  stepsDirection: 1 | 0 | -1 | null; moodDirection: 1 | 0 | -1 | null;
  autonomyBefore: string; autonomyAfter: string; participationBefore: string; participationAfter: string;
  periodMonths: number;
  activityMonthCounts: { thisMonth: number; lastMonth: number };
  sessionMonthCounts: { thisMonth: number; lastMonth: number };
  objectiveMonthCounts: { thisMonth: number; lastMonth: number };
  emotions: EmotionalRecord[];
  emotionPattern: EmotionPattern | null;
  onOpenDetail: (kind: DetailKind) => void;
}

export default function EvolutionOverview(props: EvolutionOverviewProps) {
  const {
    personName, userId, canViewHistory, autonomyLabel, weeks, recentSteps, earlierSteps, recentMood, earlierMood, stepsDirection, moodDirection,
    autonomyBefore, autonomyAfter, participationBefore, participationAfter, periodMonths,
    activityMonthCounts, sessionMonthCounts, objectiveMonthCounts, emotions, emotionPattern, onOpenDetail,
  } = props;

  const previousPeriodLabel = periodMonths === 1 ? 'Mes pasado' : `${periodMonths} meses antes`;
  const cards: (EvolutionMetricCardProps & { key: string })[] = [];

  cards.push({
    key: 'autonomy', icon: ListChecks, title: autonomyLabel, unit: 'pasos por semana',
    value: recentSteps !== null ? Math.round(recentSteps) : null,
    previousLabel: earlierSteps !== null ? `Antes: ${Math.round(earlierSteps)}` : null,
    direction: stepsDirection,
    sparklineValues: weeks.length > 1 ? weeks.map(week => week.routineCompletions) : undefined,
    beforeText: autonomyBefore, afterText: autonomyAfter,
    onOpen: () => onOpenDetail('autonomy'),
  });

  const moodWeeks = weeks.filter(week => week.positiveEmotionRatio !== null);
  cards.push({
    key: 'mood', icon: Smile, title: 'Estado de ánimo', unit: 'registros positivos',
    value: recentMood !== null ? Math.round(recentMood * 100) : null,
    previousLabel: earlierMood !== null ? `Antes: ${Math.round(earlierMood * 100)}%` : null,
    direction: moodDirection,
    sparklineValues: moodWeeks.length > 1 ? moodWeeks.map(week => (week.positiveEmotionRatio as number) * 100) : undefined,
    beforeText: participationBefore, afterText: participationAfter,
    onOpen: () => onOpenDetail('mood'),
  });

  if (activityMonthCounts.thisMonth + activityMonthCounts.lastMonth > 0) {
    cards.push({
      key: 'activities', icon: CheckCircle2, title: 'Actividades completadas', unit: 'completadas',
      value: activityMonthCounts.thisMonth, previousLabel: `${previousPeriodLabel}: ${activityMonthCounts.lastMonth}`,
      direction: trendDirection(activityMonthCounts.thisMonth - activityMonthCounts.lastMonth, 0.5),
      barColumns: { values: [activityMonthCounts.lastMonth, activityMonthCounts.thisMonth], labels: ['Antes', 'Ahora'] },
      beforeText: `${activityMonthCounts.lastMonth} ${activityMonthCounts.lastMonth === 1 ? 'actividad completada.' : 'actividades completadas.'}`,
      afterText: `${activityMonthCounts.thisMonth} ${activityMonthCounts.thisMonth === 1 ? 'actividad completada.' : 'actividades completadas.'}`,
      onOpen: () => onOpenDetail('activities'),
    });
  }
  if (sessionMonthCounts.thisMonth + sessionMonthCounts.lastMonth > 0) {
    cards.push({
      key: 'sessions', icon: Users, title: 'Sesiones con profesionales', unit: 'realizadas',
      value: sessionMonthCounts.thisMonth, previousLabel: `${previousPeriodLabel}: ${sessionMonthCounts.lastMonth}`,
      direction: trendDirection(sessionMonthCounts.thisMonth - sessionMonthCounts.lastMonth, 0.5),
      barColumns: { values: [sessionMonthCounts.lastMonth, sessionMonthCounts.thisMonth], labels: ['Antes', 'Ahora'] },
      beforeText: `${sessionMonthCounts.lastMonth} ${sessionMonthCounts.lastMonth === 1 ? 'sesión realizada.' : 'sesiones realizadas.'}`,
      afterText: `${sessionMonthCounts.thisMonth} ${sessionMonthCounts.thisMonth === 1 ? 'sesión realizada.' : 'sesiones realizadas.'}`,
      onOpen: () => onOpenDetail('sessions'),
    });
  }
  if (objectiveMonthCounts.thisMonth + objectiveMonthCounts.lastMonth > 0) {
    cards.push({
      key: 'objectives', icon: Target, title: 'Objetivos cumplidos', unit: 'cumplidos',
      value: objectiveMonthCounts.thisMonth, previousLabel: `${previousPeriodLabel}: ${objectiveMonthCounts.lastMonth}`,
      direction: trendDirection(objectiveMonthCounts.thisMonth - objectiveMonthCounts.lastMonth, 0.5),
      barColumns: { values: [objectiveMonthCounts.lastMonth, objectiveMonthCounts.thisMonth], labels: ['Antes', 'Ahora'] },
      beforeText: `${objectiveMonthCounts.lastMonth} ${objectiveMonthCounts.lastMonth === 1 ? 'objetivo cumplido.' : 'objetivos cumplidos.'}`,
      afterText: `${objectiveMonthCounts.thisMonth} ${objectiveMonthCounts.thisMonth === 1 ? 'objetivo cumplido.' : 'objetivos cumplidos.'}`,
      onOpen: () => onOpenDetail('objectives'),
    });
  }

  const summary = buildOverviewSummary(cards.map(card => card.direction));
  const oddLast = cards.length % 2 === 1;
  const exportCards = cards.map(card => ({
    title: card.title,
    before: card.previousLabel ?? '—',
    after: card.value === null ? '—' : `${card.value} ${card.unit}`,
    direction: card.direction,
  }));

  return (
    <div className="space-y-5">
      <EvolutionSummaryCard summary={summary} />

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-[var(--evo-text-secondary)]">Qué cambió</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
          {cards.map((card, index) => {
            const { key, ...rest } = card;
            return <EvolutionMetricCard key={key} {...rest} spanFull={oddLast && index === cards.length - 1} />;
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-[var(--evo-text-secondary)]">Para conversar</p>
        <EvolutionEmotionsCard emotions={emotions} pattern={emotionPattern} />
      </div>

      {canViewHistory && (
        <EvolutionShareCard personName={personName} userId={userId} weeks={weeks} summaryPhrase={summary.phrase} cards={exportCards} />
      )}
    </div>
  );
}
