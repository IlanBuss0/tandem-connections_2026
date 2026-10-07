import { useEffect, useRef, useState } from 'react';
import { fetchHelpSpots, type HelpSpotsReport } from '@/data/usageApi';

export interface HelpSpotsState {
  loading: boolean;
  failed: boolean;
  report: HelpSpotsReport | null;
}

const INITIAL: HelpSpotsState = { loading: true, failed: false, report: null };

/** Carga "Dónde se traba" una sola vez por persona, aunque la tarjeta se monte dos veces (celular y compu). */
export function useHelpSpots(userId: string, enabled: boolean): HelpSpotsState {
  const [state, setState] = useState<HelpSpotsState>(INITIAL);
  const requestedFor = useRef<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (requestedFor.current !== null && requestedFor.current !== userId) {
      requestedFor.current = null;
      setState(INITIAL);
    }
    if (!enabled || requestedFor.current === userId) return;
    requestedFor.current = userId;
    void fetchHelpSpots(userId).then(report => {
      if (!mounted.current || requestedFor.current !== userId) return;
      setState({ loading: false, failed: report === null, report });
    });
  }, [userId, enabled]);

  return state;
}
