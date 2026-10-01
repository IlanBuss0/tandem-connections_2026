import { useState } from 'react';
import { Smile } from 'lucide-react';
import type { EmotionalRecord } from '@/data/api';
import type { EvolutionWeek } from '@/data/usageApi';
import Sparkline from '../charts/Sparkline';
import HBarList from '../charts/HBarList';
import TrendBadge from '../TrendBadge';

const PAGE_SIZE = 5;

export default function MoodDetailContent({ emotions, weeks, direction, afterText, beforePercent, afterPercent }: {
  emotions: EmotionalRecord[]; weeks: EvolutionWeek[]; direction: 1 | 0 | -1 | null; afterText: string;
  beforePercent: number | null; afterPercent: number | null;
}) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sorted = [...emotions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);
  const shown = sorted.slice(0, visible);
  const moodValues = weeks.filter(w => w.positiveEmotionRatio !== null).map(w => (w.positiveEmotionRatio as number) * 100);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[var(--evo-soft)] p-4">
        <TrendBadge direction={direction} />
        <p className="mt-2 text-sm text-[var(--evo-primary-text)]">{afterText}</p>
      </div>
      {beforePercent !== null && afterPercent !== null && (
        <div className="rounded-2xl border border-[var(--evo-border-1)] bg-white p-4">
          <p className="text-sm font-bold text-[var(--evo-text)]">Registros positivos</p>
          <div className="mt-3"><HBarList items={[{ label: 'Antes', value: Math.round(beforePercent) }, { label: 'Ahora', value: Math.round(afterPercent) }]} max={100} formatValue={v => `${v}%`} /></div>
          {moodValues.length > 1 && (
            <>
              <p className="mt-4 text-sm font-bold text-[var(--evo-text)]">Semana a semana</p>
              <div className="mt-2"><Sparkline values={moodValues} label="Ánimo positivo por semana" /></div>
            </>
          )}
        </div>
      )}
      {!sorted.length && <p className="text-sm text-[var(--evo-text-secondary)]">Todavía no hay registros emocionales para compartir.</p>}
      {sorted.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--evo-text-secondary)]">Registros compartidos</p>
          <ul className="divide-y divide-[var(--evo-border-3)] rounded-2xl border border-[var(--evo-border-1)] bg-white px-3">
            {shown.map(emotion => (
              <li key={emotion.id} className="flex items-start gap-3 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--evo-soft)] text-[var(--evo-primary)]"><Smile size={16} aria-hidden /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--evo-text)]">{emotion.emotion}</p>
                  {emotion.context && <p className="text-xs text-[var(--evo-text-secondary)]">{emotion.context}</p>}
                </div>
                <span className="shrink-0 text-xs text-[var(--evo-text-secondary)]">{new Date(emotion.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {sorted.length > visible && (
        <button type="button" onClick={() => setVisible(v => v + PAGE_SIZE)} className="min-h-11 w-full rounded-2xl border border-[var(--evo-border-2)] text-sm font-bold text-[var(--evo-primary)]">Ver más registros</button>
      )}
      {sorted.length > 0 && <p className="text-xs text-[var(--evo-text-secondary)]">Son los registros que la persona eligió compartir.</p>}
    </div>
  );
}
