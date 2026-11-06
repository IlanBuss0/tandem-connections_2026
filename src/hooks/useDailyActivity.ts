import { useEffect, useState } from 'react';
import { loadDailyActivity, type DailyActivity } from '@/data/dailyActivity';
import type { PertenecienteHomeActivity } from '@/data/api';
import { localDateKey } from '@/lib/routineDay';

type Snapshot = {
  key: string;
  activities: PertenecienteHomeActivity[];
  result?: DailyActivity;
  error?: string;
};

export function useDailyActivity(userId: string | undefined, activities: PertenecienteHomeActivity[], loadedKey: string | null, excludedIds: string[]) {
  const [day, setDay] = useState(localDateKey);
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [retry, setRetry] = useState(0);
  const key = `${userId}:${day}`;
  const excludedKey = JSON.stringify(excludedIds);

  useEffect(() => {
    const checkDay = () => setDay(localDateKey());
    const timer = window.setInterval(checkDay, 30000);
    window.addEventListener('focus', checkDay);
    document.addEventListener('visibilitychange', checkDay);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', checkDay);
      document.removeEventListener('visibilitychange', checkDay);
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!userId || loadedKey !== key) return;
    setSnapshot(undefined);
    void loadDailyActivity(userId, day, activities, JSON.parse(excludedKey))
      .then(result => { if (active) setSnapshot({ key, activities, result }); })
      .catch(() => {
        if (active) setSnapshot({ key, activities, error: 'No pudimos verificar tu actividad del día. Intentá nuevamente.' });
      });
    return () => { active = false; };
  }, [userId, day, key, loadedKey, activities, excludedKey, retry]);

  const current = loadedKey === key && snapshot?.key === key && snapshot.activities === activities ? snapshot : undefined;
  return { day, result: current?.result, error: current?.error, retry: () => setRetry(value => value + 1) };
}
