import type { EmotionCount } from '@/lib/emotionSummary';

// Tonos neutros (sin verde/rojo): el color nunca dice si una emoción es "buena" o "mala".
const TONES = ['#6F4CA6', '#9B7FD1', '#C4B0E4', '#4DA8D8', '#8FA3C8', '#B9A6D9', '#7A6A99', '#A9C7E0'];

export type EmotionStatsData = {
  daysWithRecord: number;
  totalDays: number;
  records: number;
  previousRecords: number;
  previousLabel: string;
  distribution: EmotionCount[];
};

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export default function EmotionStats({ stats }: { stats: EmotionStatsData }) {
  const top = stats.distribution[0];
  return (
    <section aria-label="Números del período" className="space-y-3 rounded-[24px] border border-[#ece3f8] bg-white p-3.5 shadow-[0_8px_24px_#f0e8f8] sm:p-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[var(--evo-block)] p-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--evo-primary-text)]">Días con registro</p>
          <p className="mt-1 text-lg font-extrabold text-[var(--evo-text)]">{stats.daysWithRecord} de {stats.totalDays}</p>
        </div>
        <div className="rounded-2xl bg-[var(--evo-block)] p-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--evo-primary-text)]">Registros</p>
          <p className="mt-1 text-lg font-extrabold text-[var(--evo-text)]">{stats.records}</p>
          <p className="text-xs text-[var(--evo-text-secondary)]">{stats.previousLabel}: {stats.previousRecords}</p>
        </div>
      </div>
      {top && (
        <div className="rounded-2xl bg-[var(--evo-block)] p-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--evo-primary-text)]">Emoción más elegida</p>
          <p className="mt-1 flex items-center gap-2 text-base font-extrabold text-[var(--evo-text)]">
            <span aria-hidden className="text-2xl">{top.emoji}</span>{top.emotion}
            <span className="text-sm font-bold text-[var(--evo-text-secondary)]">· {plural(top.count, 'vez', 'veces')}</span>
          </p>
          <div role="img" aria-label="Distribución por emoción" className="mt-3 flex h-3 overflow-hidden rounded-full bg-[var(--evo-track)]">
            {stats.distribution.map((item, index) => <span key={item.emotion} style={{ width: `${item.share * 100}%`, background: TONES[index % TONES.length] }} />)}
          </div>
          <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
            {stats.distribution.map((item, index) => (
              <li key={item.emotion} className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--evo-text)]">
                <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: TONES[index % TONES.length] }} />
                <span aria-hidden>{item.emoji}</span>{item.emotion} · {item.count}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
