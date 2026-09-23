import { useEffect, useState } from 'react';

// Unica responsabilidad: recordar la ultima tab abierta de una pantalla en
// sessionStorage (nunca localStorage: se limpia con la sesion del navegador,
// no persiste entre usuarios en un dispositivo compartido).
export function useRememberedTab<T extends string>(
  storageKey: string,
  allowed: readonly T[],
  fallback: T,
): [T, (next: T) => void] {
  const read = (key: string): T => {
    try {
      const stored = window.sessionStorage.getItem(key);
      return stored && (allowed as readonly string[]).includes(stored) ? (stored as T) : fallback;
    } catch {
      return fallback;
    }
  };

  const [key, setKey] = useState(storageKey);
  const [tab, setTab] = useState<T>(() => read(storageKey));

  useEffect(() => {
    if (key !== storageKey) {
      setKey(storageKey);
      setTab(read(storageKey));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const update = (next: T) => {
    setTab(next);
    try {
      window.sessionStorage.setItem(storageKey, next);
    } catch {
      // sessionStorage no disponible (modo privado, cuota, etc.): se ignora
    }
  };

  return [tab, update];
}
