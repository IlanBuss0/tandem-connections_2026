import type { EmotionalRecord } from '@/data/api';

type Props = { title: string; records: EmotionalRecord[] };

export default function EmotionDayDetail({ title, records }: Props) {
  return (
    <section aria-label={title} className="space-y-2">
      <h3 className="px-1 text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--evo-primary-text)]">{title}</h3>
      <div className="rounded-[24px] border border-[#ece3f8] bg-white p-3.5 shadow-[0_8px_24px_#f0e8f8] sm:p-5">
      {records.length === 0 && <p className="text-sm text-[var(--evo-text-secondary)]">No hubo registros este día.</p>}
      <ul className="space-y-3">
        {records.map(record => (
          <li key={record.id} className="flex gap-3 rounded-2xl bg-[var(--evo-block)] p-3">
            <span aria-hidden className="text-3xl leading-none">{record.emoji || '🙂'}</span>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-extrabold text-[var(--evo-text)]">{record.emotion}</p>
              <p className="text-xs font-semibold text-[var(--evo-text-secondary)]">{record.intensity} de 5 · {record.timestamp}</p>
              {record.context && <p className="break-words text-sm text-[var(--evo-text)]"><span className="font-bold">Escribió:</span> {record.context}</p>}
              {record.whatHelped && <p className="break-words text-sm text-[var(--evo-text)]"><span className="font-bold">Lo que ayudó:</span> {record.whatHelped}</p>}
            </div>
          </li>
        ))}
      </ul>
      </div>
    </section>
  );
}
