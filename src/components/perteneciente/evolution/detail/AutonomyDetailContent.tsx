import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { fetchUsageEvents, type EvolutionWeek, type UsageEventRecord } from '@/data/usageApi';
import { isoWeekStart } from '../evolutionHelpers';
import BarColumns from '../charts/BarColumns';
import TrendBadge from '../TrendBadge';

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, now)) return 'Hoy';
  if (sameDay(date, yesterday)) return 'Ayer';
  return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, first => first.toUpperCase());
}

const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

export default function AutonomyDetailContent({ userId, weeks, direction, afterText }: {
  userId: string; weeks: EvolutionWeek[]; direction: 1 | 0 | -1 | null; afterText: string;
}) {
  const [events, setEvents] = useState<UsageEventRecord[] | null>(null);
  const [visible, setVisible] = useState(20);

  useEffect(() => {
    let mounted = true;
    fetchUsageEvents(userId, { tipoEvento: 'rutina_paso_completado', limit: 50 }).then(rows => { if (mounted) setEvents(rows); });
    return () => { mounted = false; };
  }, [userId]);

  const shown = (events ?? []).slice(0, visible);
  const grouped: { day: string; items: UsageEventRecord[] }[] = [];
  shown.forEach(event => {
    const day = dayLabel(event.ocurrido_en);
    const group = grouped.find(entry => entry.day === day);
    if (group) group.items.push(event); else grouped.push({ day, items: [event] });
  });

  const recentWeeks = weeks.slice(-5);
  const weekLabels = recentWeeks.map(week => {
    const date = isoWeekStart(week.week);
    return date ? date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : week.week;
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[var(--evo-soft)] p-4">
        <TrendBadge direction={direction} />
        <p className="mt-2 text-sm text-[var(--evo-primary-text)]">{afterText}</p>
      </div>
      {recentWeeks.length > 1 && (
        <div className="rounded-2xl border border-[var(--evo-border-1)] bg-white p-4">
          <p className="text-sm font-bold text-[var(--evo-text)]">Pasos por semana</p>
          <div className="mt-3"><BarColumns values={recentWeeks.map(w => w.routineCompletions)} labels={weekLabels} /></div>
        </div>
      )}
      {events === null && <p className="text-sm text-[var(--evo-text-secondary)]">Cargando…</p>}
      {events !== null && events.length === 0 && <p className="text-sm text-[var(--evo-text-secondary)]">Todavía no hay pasos de rutina registrados.</p>}
      {grouped.map(group => (
        <div key={group.day}>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--evo-text-secondary)]">{group.day}</p>
          <ul className="divide-y divide-[var(--evo-border-3)] rounded-2xl border border-[var(--evo-border-1)] bg-white px-3">
            {group.items.map(item => (
              <li key={item.id} className="flex items-center gap-3 py-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--evo-good-bg)] text-[var(--evo-good-text)]"><CheckCircle2 size={15} aria-hidden /></span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--evo-text)]">{(item.valor?.title as string | undefined) || 'Un paso de su rutina'}</span>
                <span className="shrink-0 text-xs text-[var(--evo-text-secondary)]">{timeLabel(item.ocurrido_en)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {events && events.length > visible && (
        <button type="button" onClick={() => setVisible(v => v + 20)} className="min-h-11 w-full rounded-2xl border border-[var(--evo-border-2)] text-sm font-bold text-[var(--evo-primary)]">Ver más pasos</button>
      )}
      {events !== null && events.length > 0 && (
        <p className="text-xs text-[var(--evo-text-secondary)]">Mostramos los últimos pasos que completó. No se muestran los que no hizo.</p>
      )}
    </div>
  );
}
