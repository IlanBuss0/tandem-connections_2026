import { useEffect, useState } from 'react';

const DESKTOP_QUERY = '(min-width: 1024px)';

/** true cuando se muestra el layout de dos columnas (breakpoint `lg` de Tailwind). */
export function useIsDesktop(): boolean {
  const read = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(DESKTOP_QUERY).matches;
  const [isDesktop, setIsDesktop] = useState(read);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(DESKTOP_QUERY);
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  return isDesktop;
}
