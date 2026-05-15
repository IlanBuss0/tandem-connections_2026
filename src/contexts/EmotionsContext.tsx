import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { createEmotionRecord, deleteEmotionRecord, EmotionalRecord, fetchEmotionRecordsForUser } from '@/data/api';

export const emotionOptions = [
  { emoji: '😊', label: 'Contento' }, { emoji: '😄', label: 'Feliz' }, { emoji: '😌', label: 'Tranquilo' }, { emoji: '💪', label: 'Motivado' },
  { emoji: '🥹', label: 'Orgulloso' }, { emoji: '😰', label: 'Ansioso' }, { emoji: '😬', label: 'Nervioso' }, { emoji: '😤', label: 'Frustrado' },
  { emoji: '😡', label: 'Enojado' }, { emoji: '😢', label: 'Triste' }, { emoji: '😴', label: 'Cansado' }, { emoji: '😐', label: 'Aburrido' },
  { emoji: '😲', label: 'Sorprendido' }, { emoji: '😟', label: 'Preocupado' },
];

interface Ctx {
  records: EmotionalRecord[];
  add: (rec: Omit<EmotionalRecord, 'id' | 'userId' | 'timestamp' | 'date'> & Partial<Pick<EmotionalRecord, 'timestamp' | 'date'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  quickLog: (label: string) => Promise<void>;
}

const EmotionsContext = createContext<Ctx | null>(null);

export function EmotionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [records, setRecords] = useState<EmotionalRecord[]>([]);

  useEffect(() => {
    let mounted = true;
    if (!user) return;
    fetchEmotionRecordsForUser(user.id).then(data => mounted && setRecords(data)).catch(() => mounted && setRecords([]));
    return () => { mounted = false; };
  }, [user]);

  const add: Ctx['add'] = useCallback(async (rec) => {
    if (!user) return;
    const opt = emotionOptions.find(o => o.label === rec.emotion);
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
  }, [user]);

  const remove: Ctx['remove'] = useCallback(async (id: string) => {
    await deleteEmotionRecord(id);
    setRecords(prev => prev.filter(r => r.id !== id));
  }, []);

  const quickLog: Ctx['quickLog'] = useCallback(async (label: string) => {
    const opt = emotionOptions.find(o => o.label === label);
    if (!opt) return;
    await add({ emotion: label, emoji: opt.emoji, intensity: 3, context: '', whatHelped: '' });
  }, [add]);

  const value = useMemo(() => ({ records, add, remove, quickLog }), [records, add, remove, quickLog]);
  return <EmotionsContext.Provider value={value}>{children}</EmotionsContext.Provider>;
}

export function useEmotions() {
  const ctx = useContext(EmotionsContext);
  if (!ctx) throw new Error('useEmotions must be used inside EmotionsProvider');
  return ctx;
}
