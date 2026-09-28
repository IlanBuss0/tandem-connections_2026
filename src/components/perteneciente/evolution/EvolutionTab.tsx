import { useMemo, useState } from 'react';
import { Activity, LineChart, MessageCircle, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { EmotionalRecord } from '@/data/api';
import { useRememberedTab } from '@/hooks/useRememberedTab';
import { useDailyEvolutionSummary, useEvolutionSummary } from './useEvolutionSummary';
import { activityIsDone, buildEvolutionCopy, mostFrequentEmotion } from './evolutionHelpers';
import EvolutionPeriodSelector from './EvolutionPeriodSelector';
import { PERIODS, PERIOD_CONFIG, countByPeriod, type Period } from './evolutionPeriods';
import EvolutionOverview from './EvolutionOverview';
import EvolutionWeekly from './EvolutionWeekly';
import EvolutionCommunication from './EvolutionCommunication';
import EvolutionDetailSheet, { type DetailKind } from './EvolutionDetailSheet';

type SubTab = 'changes' | 'weekly' | 'communication';
const SUB_TABS: readonly SubTab[] = ['changes', 'weekly', 'communication'];

export interface EvolutionTabProps {
  person: { id: string | number; name: string; autonomy?: string };
  activities: { id: string; title: string; status: string; completed?: boolean; completedAt?: string | null }[];
  emotions: EmotionalRecord[];
  sessions: { id: number; titulo: string; estado: string; fecha_sesion: string }[];
  historyObjectives: { id: number; titulo: string; fecha_actualizacion: string }[];
  currentUserId?: string | number;
  canViewHistory: boolean;
}

export default function EvolutionTab({ person, activities, emotions, sessions, historyObjectives, currentUserId, canViewHistory }: EvolutionTabProps) {
  const userId = String(person.id);
  const subTabStorageKey = `tandem:evolucion-subtab:${currentUserId ?? 'anon'}:${person.id}`;
  const periodStorageKey = `tandem:evolucion-periodo:${currentUserId ?? 'anon'}:${person.id}`;
  const [subTab, setSubTab] = useRememberedTab<SubTab>(subTabStorageKey, SUB_TABS, 'changes');
  const [period, setPeriod] = useRememberedTab<Period>(periodStorageKey, PERIODS, 'month');
  const [openDetail, setOpenDetail] = useState<DetailKind | null>(null);

  const config = PERIOD_CONFIG[period];
  // `weekly` alimenta la sub-tab Semanas, el detalle y el PDF; `evolution` es
  // el resumen del período elegido (la serie diaria en Hoy / Última semana).
  const weekly = useEvolutionSummary(userId, config.weeks);
  const daily = useDailyEvolutionSummary(userId, config.days);
  const evolution = config.days ? daily : weekly;
  const copyWording = useMemo(() => ({ perWord: config.perWord, when: config.days ? 'Antes' : 'Hace unas semanas' }), [config]);
  const evolutionCopy = useMemo(() => buildEvolutionCopy(evolution, activities.length, copyWording), [evolution, activities.length, copyWording]);

  const activityMonthCounts = useMemo(() => countByPeriod(
    activities.filter(item => activityIsDone(item) && item.completedAt).map(item => new Date(item.completedAt as string)).filter(date => !Number.isNaN(date.getTime())),
    config,
  ), [activities, config]);
  const sessionMonthCounts = useMemo(() => countByPeriod(
    sessions.filter(session => session.estado === 'completada').map(session => new Date(session.fecha_sesion)).filter(date => !Number.isNaN(date.getTime())),
    config,
  ), [sessions, config]);
  const objectiveMonthCounts = useMemo(() => countByPeriod(
    historyObjectives.map(objective => new Date(objective.fecha_actualizacion)).filter(date => !Number.isNaN(date.getTime())),
    config,
  ), [historyObjectives, config]);
  const emotionPattern = useMemo(() => {
    const sortedAsc = [...emotions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sortedAsc.length < 4) return null;
    const recentCount = Math.max(1, Math.floor(sortedAsc.length / 2));
    const earlier = mostFrequentEmotion(sortedAsc.slice(0, sortedAsc.length - recentCount));
    const recent = mostFrequentEmotion(sortedAsc.slice(-recentCount));
    return earlier && recent ? { earlier, recent } : null;
  }, [emotions]);

  const tabs: { id: SubTab; label: string; icon: typeof Activity }[] = [
    { id: 'changes', label: 'Cambios', icon: TrendingUp },
    { id: 'weekly', label: 'Semanas', icon: LineChart },
    { id: 'communication', label: 'Comunicación', icon: MessageCircle },
  ];

  return (
    <section className="evolution-scope min-w-0 rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-[0_14px_34px_rgba(65,76,110,.08)] backdrop-blur sm:p-5">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--evo-soft)] text-[var(--evo-primary)]"><Activity size={19} aria-hidden /></span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[var(--evo-primary-text)]">Evolución</p>
            <h2 className="font-heading text-lg font-bold text-[var(--evo-text)]">Cambios que podemos observar</h2>
          </div>
        </div>
        <Tabs value={subTab} onValueChange={value => setSubTab(value as SubTab)}>
          <TabsList className="grid grid-cols-3 gap-1 rounded-2xl bg-[var(--evo-tabs-bg)] p-1">
            {tabs.map(item => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold text-[var(--evo-text-inactive)] data-[state=active]:bg-[var(--evo-primary)] data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                <item.icon size={15} aria-hidden /> <span>{item.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </header>

      <Tabs value={subTab}>
        <TabsContent value="changes" className="mt-0 space-y-4">
          {subTab === 'changes' && (
            <>
              <EvolutionPeriodSelector period={period} onChange={setPeriod} />
              <EvolutionOverview
                personName={person.name}
                userId={userId}
                canViewHistory={canViewHistory}
                autonomyLabel={person.autonomy || 'Autonomía cotidiana'}
                weeks={evolution.weeks}
                recentSteps={evolution.recentSteps}
                earlierSteps={evolution.earlierSteps}
                recentMood={evolution.recentMood}
                earlierMood={evolution.earlierMood}
                stepsDirection={evolutionCopy.stepsDirection}
                moodDirection={evolutionCopy.moodDirection}
                autonomyBefore={evolutionCopy.autonomyBefore}
                autonomyAfter={evolutionCopy.autonomyAfter}
                participationBefore={evolutionCopy.participationBefore}
                participationAfter={evolutionCopy.participationAfter}
                previousLabel={config.previousLabel}
                perWord={config.perWord}
                reportWeeks={weekly.weeks}
                activityMonthCounts={activityMonthCounts}
                sessionMonthCounts={sessionMonthCounts}
                objectiveMonthCounts={objectiveMonthCounts}
                emotions={emotions}
                emotionPattern={emotionPattern}
                onOpenDetail={setOpenDetail}
              />
            </>
          )}
        </TabsContent>
        <TabsContent value="weekly" className="mt-0">
          {subTab === 'weekly' && <EvolutionWeekly userId={userId} weeks={weekly.weeks} />}
        </TabsContent>
        <TabsContent value="communication" className="mt-0">
          {subTab === 'communication' && <EvolutionCommunication userId={userId} canViewHistory={canViewHistory} />}
        </TabsContent>
      </Tabs>

      <EvolutionDetailSheet
        open={openDetail}
        onClose={() => setOpenDetail(null)}
        userId={userId}
        autonomyLabel={person.autonomy || 'Autonomía cotidiana'}
        weeks={weekly.weeks}
        stepsDirection={evolutionCopy.stepsDirection}
        moodDirection={evolutionCopy.moodDirection}
        autonomyAfter={evolutionCopy.autonomyAfter}
        participationAfter={evolutionCopy.participationAfter}
        earlierMood={evolution.earlierMood}
        recentMood={evolution.recentMood}
        emotions={emotions}
        activities={activities}
        sessions={sessions}
        historyObjectives={historyObjectives}
        canViewHistory={canViewHistory}
      />
    </section>
  );
}
