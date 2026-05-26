import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { createEmotionRecord, deleteEmotionRecord, EmotionalRecord, fetchEmotionRecordsForUser } from '@/data/api';

export const emotionOptions = [
  { emoji: '😊', label: 'Contento' },
  { emoji: '😄', label: 'Feliz' },
  { emoji: '😌', label: 'Tranquilo' },
  { emoji: '💪', label: 'Motivado' },
  { emoji: '🥹', label: 'Orgulloso' },
  { emoji: '😰', label: 'Ansioso' },
  { emoji: '😬', label: 'Nervioso' },
  { emoji: '😤', label: 'Frustrado' },
  { emoji: '😡', label: 'Enojado' },
  { emoji: '😢', label: 'Triste' },
  { emoji: '😴', label: 'Cansado' },
  { emoji: '😐', label: 'Aburrido' },
  { emoji: '😲', label: 'Sorprendido' },
  { emoji: '😟', label: 'Preocupado' },
];

interface Ctx {
  records: EmotionalRecord[];
  loading: boolean;
  error: string | null;
  add: (rec: Omit<EmotionalRecord, 'id' | 'userId' | 'timestamp' | 'date'> & Partial<Pick<EmotionalRecord, 'timestamp' | 'date'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  quickLog: (label: string) => Promise<void>;
  reload: () => Promise<void>;
}

const EmotionsContext = createContext<Ctx | null>(null);

export function EmotionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [records, setRecords] = useState<EmotionalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) {
      setRecords([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchEmotionRecordsForUser(user.id);
      setRecords(data);
    } catch {
      setRecords([]);
      setError('No se pudieron cargar los registros emocionales.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const add: Ctx['add'] = useCallback(async (rec) => {
    if (!user) return;
    const opt = emotionOptions.find(o => o.label === rec.emotion);

    setError(null);

    try {
      const created = await createEmotionRecord(user.id, {
        emotion: rec.emotion,
        emoji: rec.emoji || opt?.emoji || '😊',
        intensity: rec.intensity,
        context: rec.context || '',
        whatHelped: rec.whatHelped || '',
        timestamp: rec.timestamp || new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        date: rec.date || new Date().toISOString().split('T')[0],
      });
      setRecords(prev => [created, ...prev]);
    } catch {
      setError('No se pudo registrar la emocion.');
      throw new Error('No se pudo registrar la emocion.');
    }
  }, [user]);

  const remove: Ctx['remove'] = useCallback(async (id: string) => {
    setError(null);

    try {
      await deleteEmotionRecord(id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch {
      setError('No se pudo eliminar el registro.');
      throw new Error('No se pudo eliminar el registro.');
    }
  }, []);

  const quickLog: Ctx['quickLog'] = useCallback(async (label: string) => {
    const opt = emotionOptions.find(o => o.label === label);
    if (!opt) return;
    await add({ emotion: label, emoji: opt.emoji, intensity: 3, context: '', whatHelped: '' });
  }, [add]);

  const value = useMemo(
    () => ({ records, loading, error, add, remove, quickLog, reload }),
    [records, loading, error, add, remove, quickLog, reload]
  );

  return <EmotionsContext.Provider value={value}>{children}</EmotionsContext.Provider>;
}

export function useEmotions() {
  const ctx = useContext(EmotionsContext);
  if (!ctx) throw new Error('useEmotions must be used inside EmotionsProvider');
  return ctx;
}
