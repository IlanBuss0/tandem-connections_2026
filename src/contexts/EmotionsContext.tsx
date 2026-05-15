import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { emotionalRecords as seed, EmotionalRecord } from '@/data/api';

const KEY = (uid: string) => `tandem:emotions:${uid}:v1`;

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
  add: (rec: Omit<EmotionalRecord, 'id' | 'userId' | 'timestamp' | 'date'> & Partial<Pick<EmotionalRecord, 'timestamp' | 'date'>>) => void;
  remove: (id: string) => void;
  quickLog: (label: string) => void;
}

const EmotionsContext = createContext<Ctx | null>(null);

export function EmotionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [records, setRecords] = useState<EmotionalRecord[]>([]);

  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(KEY(user.id));
      if (raw) { setRecords(JSON.parse(raw)); return; }
    } catch { /* noop */ }
    setRecords(seed.filter(e => e.userId === user.id));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    try { localStorage.setItem(KEY(user.id), JSON.stringify(records)); } catch { /* noop */ }
  }, [records, user]);

  const add: Ctx['add'] = useCallback((rec) => {
    if (!user) return;
    const opt = emotionOptions.find(o => o.label === rec.emotion);
    const newRec: EmotionalRecord = {
      id: `em-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: user.id,
      emotion: rec.emotion,
      emoji: rec.emoji || opt?.emoji || '😊',
      intensity: rec.intensity,
      context: rec.context || '',
      whatHelped: rec.whatHelped || '',
      timestamp: rec.timestamp || new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      date: rec.date || new Date().toISOString().split('T')[0],
    };
    setRecords(prev => [newRec, ...prev]);
  }, [user]);

  const remove = useCallback((id: string) => setRecords(prev => prev.filter(r => r.id !== id)), []);

  const quickLog = useCallback((label: string) => {
    const opt = emotionOptions.find(o => o.label === label);
    if (!opt) return;
    add({ emotion: label, emoji: opt.emoji, intensity: 3, context: '', whatHelped: '' });
  }, [add]);

  const value = useMemo(() => ({ records, add, remove, quickLog }), [records, add, remove, quickLog]);
  return <EmotionsContext.Provider value={value}>{children}</EmotionsContext.Provider>;
}

export function useEmotions() {
  const ctx = useContext(EmotionsContext);
  if (!ctx) throw new Error('useEmotions must be used inside EmotionsProvider');
  return ctx;
}
