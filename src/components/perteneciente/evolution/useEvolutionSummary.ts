import { useEffect, useMemo, useState } from 'react';
import { fetchEvolutionReport, type EvolutionWeek } from '@/data/usageApi';

export const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

export function splitWeeksInHalf(weeks: EvolutionWeek[]) {
  const recentCount = Math.max(1, Math.floor(weeks.length / 2));
  return { earlier: weeks.slice(0, weeks.length - recentCount), recent: weeks.slice(-recentCount) };
}

// Forma plana (sin discriminated union) a propósito: este repo compila con
// strict/strictNullChecks apagado, donde TS no angosta uniones discriminadas
// de forma confiable. `hasData` avisa si recentSteps/earlierSteps/etc. son
// datos reales; loading avisa si todavía no llegó la primera respuesta.
export interface EvolutionSummary {
  loading: boolean;
  hasData: boolean;
  recentSteps: number | null;
  earlierSteps: number | null;
  recentMood: number | null;
  earlierMood: number | null;
  weeks: EvolutionWeek[];
}

const EMPTY_STATS = { recentSteps: null, earlierSteps: null, recentMood: null, earlierMood: null };

// Unica responsabilidad: pedir y resumir las semanas de evolucion de un
// usuario. `weeks` (8 o 13) es el selector de periodo de la sub-tab
// Cambios (Prompt 2) — la tab Resumen sigue llamando esto con el default
// de 8 semanas, sin cambios de comportamiento.
export function useEvolutionSummary(userId: string, weeks = 8): EvolutionSummary {
  const [data, setData] = useState<EvolutionWeek[] | null>(null);

  useEffect(() => {
    let mounted = true;
    setData(null);
    fetchEvolutionReport(userId, weeks).then(result => { if (mounted) setData(result); });
    return () => { mounted = false; };
  }, [userId, weeks]);

  const summary = useMemo(() => {
    if (!data) return { loading: true, hasData: false, ...EMPTY_STATS };
    if (!data.length) return { loading: false, hasData: false, ...EMPTY_STATS };

    const { earlier, recent } = splitWeeksInHalf(data);
    const recentSteps = average(recent.map(week => week.routineCompletions));
    const earlierSteps = earlier.length ? average(earlier.map(week => week.routineCompletions)) : null;
    const recentMoodWeeks = recent.filter(week => week.positiveEmotionRatio !== null);
    const earlierMoodWeeks = earlier.filter(week => week.positiveEmotionRatio !== null);
    const recentMood = recentMoodWeeks.length ? average(recentMoodWeeks.map(week => week.positiveEmotionRatio as number)) : null;
    const earlierMood = earlierMoodWeeks.length ? average(earlierMoodWeeks.map(week => week.positiveEmotionRatio as number)) : null;

    return { loading: false, hasData: true, recentSteps, earlierSteps, recentMood, earlierMood };
  }, [data]);

  return { ...summary, weeks: data || [] };
}
