import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { fetchUsageEvents, type UsageEventRecord } from '@/data/usageApi';
import { describe, formatWhen, TYPE_ICON } from '@/components/TutorUsageTimeline';

export default function RecentActivityCard({ userId }: { userId: string }) {
  const [events, setEvents] = useState<UsageEventRecord[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setEvents(null);
    setError(false);
    fetchUsageEvents(userId, { limit: 5 })
      .then(rows => { if (mounted) setEvents(rows); })
      .catch(() => { if (mounted) { setEvents([]); setError(true); } });
    return () => { mounted = false; };
  }, [userId]);

  return (
    <div className="rounded-2xl border border-[var(--evo-border-1)] bg-white p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--evo-soft)] text-[var(--evo-primary)]"><Activity size={16} aria-hidden /></span>
        <p className="text-sm font-bold text-[var(--evo-text)]">Actividad reciente</p>
      </div>
      {events === null && <p className="mt-3 text-sm text-[var(--evo-text-secondary)]">Cargando…</p>}
      {events !== null && error && <p className="mt-3 text-sm text-[var(--evo-text-secondary)]">No pudimos cargar la información. Intentá nuevamente.</p>}
      {events !== null && !error && events.length === 0 && <p className="mt-3 text-sm text-[var(--evo-text-secondary)]">Todavía no hay actividad registrada.</p>}
      {events !== null && !error && events.length > 0 && (
        <>
          <ul className="mt-3 divide-y divide-[var(--evo-border-3)] lg:grid lg:grid-cols-2 lg:gap-x-6 lg:divide-y-0">
            {events.map(event => {
              const Icon = TYPE_ICON[event.tipo_evento] || Activity;
              return (
                <li key={event.id} className="flex items-center gap-2.5 py-2.5 lg:border-b lg:border-[var(--evo-border-3)]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--evo-soft)] text-[var(--evo-primary)]"><Icon size={14} aria-hidden /></span>
                  <span className="min-w-0 flex-1 truncate text-sm text-[var(--evo-text)]">{describe(event)}</span>
                  <span className="shrink-0 text-xs text-[var(--evo-text-secondary)]">{formatWhen(event.ocurrido_en)}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-[var(--evo-text-secondary)]">Lo último que hizo, en orden.</p>
        </>
      )}
    </div>
  );
}
