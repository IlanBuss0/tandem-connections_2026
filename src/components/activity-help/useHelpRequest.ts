import { useCallback, useEffect, useRef, useState } from 'react';
import { tandemApi } from '@/services/api/tandem-api';
import type { Activity } from '@/data/api';

export type HelpMotivo = 'ayuda' | 'no_entiende' | 'pausa';
export type HelpStatus = 'idle' | 'sending' | 'sent' | 'failed';

/** Manda el aviso de ayuda a los tutores y guarda el estado. No reintenta solo. */
export function useHelpRequest(activity: Activity) {
  const [status, setStatus] = useState<HelpStatus>('idle');
  const [avisados, setAvisados] = useState<string[]>([]);
  const sendingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const send = useCallback(async (motivo: HelpMotivo, stepIndex: number) => {
    if (sendingRef.current) return;
    const assignedId = Number((activity as Activity & { assignedActivityId?: number | string }).assignedActivityId);
    if (!Number.isInteger(assignedId) || assignedId <= 0) {
      setAvisados([]);
      setStatus('failed');
      return;
    }
    sendingRef.current = true;
    setStatus('sending');
    try {
      const result = await tandemApi.actividadesAsignadas.requestHelp(assignedId, {
        motivo,
        paso: stepIndex + 1,
        totalPasos: activity.steps.length,
        pasoTexto: activity.steps[stepIndex],
      });
      const names = Array.isArray(result?.avisados) ? result.avisados.filter(Boolean) : [];
      if (!mountedRef.current) return;
      setAvisados(names);
      setStatus(names.length > 0 ? 'sent' : 'failed');
    } catch {
      if (!mountedRef.current) return;
      setAvisados([]);
      setStatus('failed');
    } finally {
      sendingRef.current = false;
    }
  }, [activity]);

  const reset = useCallback(() => {
    setStatus('idle');
    setAvisados([]);
  }, []);

  return { status, avisados, send, reset };
}

/** "Laura", "Laura y Pedro", "Laura, Pedro y Ana". */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] || '';
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
}
