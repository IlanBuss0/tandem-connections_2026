import { useEffect, useMemo, useState } from 'react';
import { fetchEvolutionDaily, fetchEvolutionReport, type EvolutionWeek } from '@/data/usageApi';

export const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const total = (values: number[]) => values.reduce((sum, value) => sum + value, 0);

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

// `aggregate` resume los pasos de cada mitad: promedio por semana para la
// serie semanal, suma para la diaria (una ventana de 1 o 7 días es el total
// del período).
function summarize(data: EvolutionWeek[] | null, aggregate: (values: number[]) => number | null): EvolutionSummary {
  if (!data) return { loading: true, hasData: false, ...EMPTY_STATS, weeks: [] };
  if (!data.length) return { loading: false, hasData: false, ...EMPTY_STATS, weeks: [] };

  const { earlier, recent } = splitWeeksInHalf(data);
  const recentSteps = aggregate(recent.map(week => week.routineCompletions));
  const earlierSteps = earlier.length ? aggregate(earlier.map(week => week.routineCompletions)) : null;
  const recentMoodWeeks = recent.filter(week => week.positiveEmotionRatio !== null);
  const earlierMoodWeeks = earlier.filter(week => week.positiveEmotionRatio !== null);
  const recentMood = recentMoodWeeks.length ? average(recentMoodWeeks.map(week => week.positiveEmotionRatio as number)) : null;
  const earlierMood = earlierMoodWeeks.length ? average(earlierMoodWeeks.map(week => week.positiveEmotionRatio as number)) : null;

  return { loading: false, hasData: true, recentSteps, earlierSteps, recentMood, earlierMood, weeks: data };
}

// Unica responsabilidad: pedir y resumir las semanas de evolucion de un
// usuario. `weeks` (8, 13 o 52) es el selector de periodo de la sub-tab
// Cambios — la tab Resumen sigue llamando esto con el default de 8
// semanas, sin cambios de comportamiento.
export function useEvolutionSummary(userId: string, weeks = 8): EvolutionSummary {
  const [data, setData] = useState<EvolutionWeek[] | null>(null);

  useEffect(() => {
    let mounted = true;
    setData(null);
    fetchEvolutionReport(userId, weeks).then(result => { if (mounted) setData(result); });
    return () => { mounted = false; };
  }, [userId, weeks]);

  return useMemo(() => summarize(data, average), [data]);
}

// Periodos "Hoy" (`days` = 1) y "Última semana" (7): compara la ventana
// reciente contra la anterior, pidiendo el doble de días. Sin `days` no
// pide nada (el periodo elegido usa la serie semanal).
export function useDailyEvolutionSummary(userId: string, days?: number): EvolutionSummary {
  const [data, setData] = useState<EvolutionWeek[] | null>(null);

  useEffect(() => {
    if (!days) return undefined;
    let mounted = true;
    setData(null);
    fetchEvolutionDaily(userId, days * 2).then(result => { if (mounted) setData(result); });
    return () => { mounted = false; };
  }, [userId, days]);

  return useMemo(() => summarize(days ? data : [], total), [data, days]);
}
