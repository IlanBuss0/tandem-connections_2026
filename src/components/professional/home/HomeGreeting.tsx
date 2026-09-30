import { Calendar, ChevronDown, Check, PenLine } from 'lucide-react';
import { Pressable, type ChipTone } from './HomeUi';
import { formatLongDate, plural } from './homeData';
import { cn } from '@/lib/utils';

const TONES: Record<Extract<ChipTone, 'purple' | 'amber' | 'green'>, string> = {
  purple: 'bg-[#F1EAFB] text-[#553588]', amber: 'bg-[#FFEFCF] text-[#7A4300]', green: 'bg-[#DCF5EA] text-[#0B6B4A]',
};

function ActionChip({ tone, icon, label, onClick }: { tone: keyof typeof TONES; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <Pressable onClick={onClick} className={cn('relative inline-flex min-h-8 items-center gap-[5px] whitespace-nowrap rounded-full px-[11px] text-[12px] font-bold leading-[1.25] before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-[""] [&_svg]:shrink-0', TONES[tone])}>{icon}{label}<ChevronDown size={13} strokeWidth={2.6} aria-hidden /></Pressable>;
}

type Props = { name: string; now: Date; todayCount: number; missingNotes: number; onGoToday: () => void; onGoClose: () => void };

export default function HomeGreeting({ name, now, todayCount, missingNotes, onGoToday, onGoClose }: Props) {
  const surname = name.replace(/^Lic\.?\s*/i, '').trim().split(/\s+/).slice(-1)[0];
  return <div>
    <h1 className="font-heading text-[28px] font-extrabold leading-[1.1] text-[#2B2145]">Hola, Lic. {surname}</h1>
    <p className="mt-1.5 text-[13.5px] text-[#675E78]">{formatLongDate(now)}</p>
    <div className="mt-3 flex flex-wrap gap-1.5">
      <ActionChip tone="purple" icon={<Calendar size={14} strokeWidth={2.4} aria-hidden />} label={plural(todayCount, 'sesión hoy', 'sesiones hoy')} onClick={onGoToday} />
      {missingNotes > 0
        ? <ActionChip tone="amber" icon={<PenLine size={14} strokeWidth={2.4} aria-hidden />} label={plural(missingNotes, 'nota sin escribir', 'notas sin escribir')} onClick={onGoClose} />
        : <ActionChip tone="green" icon={<Check size={14} strokeWidth={2.4} aria-hidden />} label="Notas al día" onClick={onGoClose} />}
    </div>
  </div>;
}
