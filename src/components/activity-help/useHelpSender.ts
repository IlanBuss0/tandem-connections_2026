import { useCallback, useEffect, useRef, useState } from 'react';

export type HelpStatus = 'idle' | 'sending' | 'sent' | 'failed';
export interface HelpSendResult { avisados: string[]; repetido?: boolean }

/**
 * Estado común de "avisar a mis tutores": status, nombres avisados, un solo
 * envío a la vez y nada de setState si se desmontó. `sendFn` hace el pedido y
 * devuelve `{ avisados }`; devuelve `null` si no hay nada que mandar (queda
 * `failed` sin pasar por `sending`). Falla si el pedido tira error o si no se
 * avisó a nadie. No reintenta solo. `repetido: true` se trata como éxito.
 */
export function useHelpSender<Args extends unknown[]>(sendFn: (...args: Args) => Promise<HelpSendResult> | null) {
  const [status, setStatus] = useState<HelpStatus>('idle');
  const [avisados, setAvisados] = useState<string[]>([]);
  const sendingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const send = useCallback(async (...args: Args) => {
    if (sendingRef.current) return;
    let pending: Promise<HelpSendResult> | null;
    try {
      pending = sendFn(...args);
    } catch {
      pending = null;
    }
    if (pending === null) {
      setAvisados([]);
      setStatus('failed');
      return;
    }
    sendingRef.current = true;
    setStatus('sending');
    try {
      const result = await pending;
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
  }, [sendFn]);

  const reset = useCallback(() => {
    setStatus('idle');
    setAvisados([]);
  }, []);

  return { status, avisados, send, reset };
}
