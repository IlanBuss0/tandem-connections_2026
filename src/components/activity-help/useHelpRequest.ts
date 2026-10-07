import { useCallback } from 'react';
import { tandemApi } from '@/services/api/tandem-api';
import type { Activity } from '@/data/api';
import { useHelpSender, type HelpStatus } from './useHelpSender';

export type HelpMotivo = 'ayuda' | 'no_entiende' | 'pausa';
export type { HelpStatus };

/** Manda el aviso de ayuda de una actividad asignada a los tutores y guarda el estado. No reintenta solo. */
export function useHelpRequest(activity: Activity) {
  const sendFn = useCallback((motivo: HelpMotivo, stepIndex: number) => {
    const assignedId = Number((activity as Activity & { assignedActivityId?: number | string }).assignedActivityId);
    if (!Number.isInteger(assignedId) || assignedId <= 0) return null;
    return tandemApi.actividadesAsignadas.requestHelp(assignedId, {
      motivo,
      paso: stepIndex + 1,
      totalPasos: activity.steps.length,
      pasoTexto: activity.steps[stepIndex],
    });
  }, [activity]);

  return useHelpSender(sendFn);
}

/** "Laura", "Laura y Pedro", "Laura, Pedro y Ana". */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] || '';
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
}
