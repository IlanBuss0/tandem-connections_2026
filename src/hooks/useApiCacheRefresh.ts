import { useEffect, useRef } from 'react';
import { API_CACHE_UPDATED_EVENT, type ApiCacheUpdatedDetail } from '@/services/api/client';

/**
 * Llama a `onRefresh` (agrupado en una sola llamada) cuando la cache de API
 * termino de revalidar en segundo plano una ruta que habia mostrado guardada
 * y el backend devolvio algo distinto. Si se pasa `matches`, solo reacciona a
 * esas rutas. La pantalla se actualiza sola, sin skeleton ni parpadeo.
 */
export function useApiCacheRefresh(onRefresh: () => void, matches?: (path: string) => boolean): void {
  const callbackRef = useRef(onRefresh);
  const matchesRef = useRef(matches);
  callbackRef.current = onRefresh;
  matchesRef.current = matches;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const handler = (event: Event) => {
      const path = (event as CustomEvent<ApiCacheUpdatedDetail>).detail?.path ?? '';
      if (matchesRef.current && !matchesRef.current(path)) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        callbackRef.current();
      }, 120);
    };
    window.addEventListener(API_CACHE_UPDATED_EVENT, handler);
    return () => {
      window.removeEventListener(API_CACHE_UPDATED_EVENT, handler);
      if (timer) clearTimeout(timer);
    };
  }, []);
}
