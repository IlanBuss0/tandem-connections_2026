import { CalendarDays, Clock3, ListChecks, Sparkles } from 'lucide-react';
import type { PertenecienteHomeActivity } from '@/data/api';

interface Props {
  activity: PertenecienteHomeActivity;
  onOpen: () => void;
}

const MONTH_NAMES: Record<string, string> = {
  ene: 'enero',
  feb: 'febrero',
  mar: 'marzo',
  abr: 'abril',
  may: 'mayo',
  jun: 'junio',
  jul: 'julio',
  ago: 'agosto',
  sep: 'septiembre',
  sept: 'septiembre',
  oct: 'octubre',
  nov: 'noviembre',
  dic: 'diciembre',
};

function formatUpcomingActivityDate(value: string): string {
  const normalized = value.trim().toLocaleLowerCase('es-AR').replace(/\./g, '');
  const match = normalized.match(/^(\d{1,2})[\s/-]+([a-záéíóú]+)/i);
  if (!match) return value;
  const month = MONTH_NAMES[match[2].slice(0, 4)] ?? MONTH_NAMES[match[2].slice(0, 3)];
  return month ? `${Number(match[1])} de ${month}` : value;
}

function statusClasses(status: string): string {
  const normalized = status.toLocaleLowerCase('es-AR');
  if (normalized.includes('complet')) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (normalized.includes('progreso') || normalized.includes('curso')) return 'border-blue-200 bg-blue-50 text-blue-700';
  return 'border-[#f1dfb7] bg-[#fff7df] text-[#a46612]';
}

export default function BelongingUpcomingActivityCard({ activity, onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Abrir actividad: ${activity.title}`}
      className="group flex min-h-[210px] min-w-[88%] cursor-pointer snap-start flex-col rounded-3xl border border-[#e9dff5] bg-[#fffaff] p-5 text-left shadow-[0_6px_18px_rgba(91,55,132,0.08)] transition-[transform,box-shadow,border-color,background-color] duration-200 hover:-translate-y-px hover:border-[#d6c2eb] hover:bg-white hover:shadow-[0_10px_24px_rgba(91,55,132,0.12)] active:scale-[0.99] active:bg-[#faf5ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none sm:min-w-[55%] lg:min-w-[38%] xl:min-w-[34%]"
    >
      <span className="grid w-full grid-cols-[48px_minmax(0,1fr)_auto] items-start gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f2eafb] text-[#7651a8]" aria-hidden>
          <Sparkles size={21} strokeWidth={1.8} />
        </span>

        <span className="min-w-0 pt-0.5">
          <span className="block break-words text-[17px] font-extrabold leading-[1.35] text-[#452e6d] sm:text-lg">
            {activity.title}
          </span>
        </span>

        <span className="inline-flex shrink-0 items-center gap-1.5 pt-1 text-[11px] font-semibold text-[#89799e] sm:text-xs">
          <CalendarDays size={14} aria-hidden />
          <span>{formatUpcomingActivityDate(activity.assignedAt)}</span>
        </span>
      </span>

      <span className="mt-4 block break-words text-sm font-normal leading-6 text-[#756a82] sm:pl-[60px]">
        {activity.description}
      </span>

      <span className="mt-auto w-full pt-5">
        <span className="block h-px w-full bg-[#eee5f7]" aria-hidden />
        <span className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusClasses(activity.status)}`}>
            <Clock3 size={14} aria-hidden />
            {activity.status}
          </span>

          <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#79628f]">
            <span className="hidden h-5 w-px bg-[#e5d9f1] sm:block" aria-hidden />
            <ListChecks size={16} className="text-[#7651a8]" aria-hidden />
            Actividad
          </span>
        </span>
      </span>
    </button>
  );
}
