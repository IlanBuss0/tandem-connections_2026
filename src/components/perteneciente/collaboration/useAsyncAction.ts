import { useState } from 'react';

// Unica responsabilidad: recordar que accion esta en curso (para deshabilitar
// su boton) y si la ultima fallo (para mostrar un aviso). Compartido entre
// NowCard y CollaborationFeed — misma mecanica de guardado optimista simple.
export function useAsyncAction() {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const run = async (id: string, action: () => Promise<void>) => {
    setPendingId(id);
    setError(false);
    try {
      await action();
    } catch {
      setError(true);
    } finally {
      setPendingId(null);
    }
  };

  return { pendingId, error, run };
}
