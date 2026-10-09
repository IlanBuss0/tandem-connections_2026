import { Check, Circle, Loader2, Minus, X } from 'lucide-react';

export type DniCheckStatus = 'ok' | 'fail' | 'pending' | 'skipped';
export type DniCheckItem = { id: string; label: string; status: DniCheckStatus; detail?: string | null };

const ICONS: Record<DniCheckStatus, JSX.Element> = {
  ok: <Check size={15} className="text-[#3b7a3f]" aria-hidden="true" />,
  fail: <X size={15} className="text-red-600" aria-hidden="true" />,
  pending: <Loader2 size={15} className="animate-spin text-[#6F518E]" aria-hidden="true" />,
  skipped: <Minus size={15} className="text-[#6F518E]/40" aria-hidden="true" />,
};
const STATUS_TEXT: Record<DniCheckStatus, string> = { ok: 'Listo', fail: 'Falló', pending: 'En curso', skipped: 'No fue necesario' };

export function DniChecklist({ title, items }: { title: string; items: DniCheckItem[] }) {
  return (
    <div className="rounded-2xl border border-[#C9A7EB]/50 bg-white/70 p-3 text-xs" data-testid="dni-checklist">
      <p className="mb-2 flex items-center gap-1.5 font-extrabold text-[#6F518E]"><Circle size={8} className="fill-current" aria-hidden="true" />{title}</p>
      <ul className="space-y-1.5">
        {items.map(item => (
          <li key={item.id} className="flex items-start gap-2" data-status={item.status}>
            <span className="mt-0.5 shrink-0">{ICONS[item.status]}</span>
            <span className={item.status === 'skipped' ? 'text-[#6F518E]/45' : 'font-semibold text-[#6F518E]'}>
              {item.label}
              <span className="sr-only"> — {STATUS_TEXT[item.status]}</span>
              {item.detail && <span className={`block font-medium ${item.status === 'fail' ? 'text-red-700' : 'text-[#6F518E]/65'}`}>{item.detail}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
