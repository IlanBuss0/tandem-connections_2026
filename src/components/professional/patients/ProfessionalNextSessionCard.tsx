import { useEffect, useMemo, useState } from 'react';
import { Calendar, Check, LifeBuoy, Lock, Minus, Pause, PenLine, Plus, Sparkles, TrendingUp } from 'lucide-react';
import type { ProfessionalSession } from '@/data/api';
import { fetchUsageEvents, type UsageEventRecord } from '@/data/usageApi';
import { buildEvolutionCopy } from '@/components/perteneciente/evolution/evolutionHelpers';
import { useEvolutionSummary } from '@/components/perteneciente/evolution/useEvolutionSummary';
import { Chip, HomeButton } from '@/components/professional/home/HomeUi';
import { buildNextSessionModel, type SessionAction, type SessionChipIcon } from '@/lib/professionalNextSession';
import { cn } from '@/lib/utils';

const CHIP_ICONS: Record<SessionChipIcon, typeof Check> = {
  pause: Pause, 'trend-up': TrendingUp, 'trend-flat': Minus, support: LifeBuoy, pencil: PenLine, check: Check,
};

const ACTIONS: Record<SessionAction['kind'], { label: string; icon: typeof Check; primary: boolean }> = {
  prepare: { label: 'Preparar sesión', icon: Sparkles, primary: true },
  writeNote: { label: 'Escribir nota', icon: PenLine, primary: true },
  schedule: { label: 'Agendar', icon: Plus, primary: true },
  previousNote: { label: 'Nota anterior', icon: Lock, primary: false },
};

/** Reloj propio: solo la tarjeta se vuelve a dibujar cada minuto, no el Centro. */
function useMinuteClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

type Props = {
  /** Sesiones de este paciente. */
  sessions: ProfessionalSession[];
  /** Id de usuario del paciente (eventos de uso y evolución). */
  userId: string;
  canViewHistory: boolean;
  canSchedule: boolean;
  openAgreements: number;
  onPrepare: (session: ProfessionalSession) => void;
  onOpenNote: (session: ProfessionalSession) => void;
  onSchedule: () => void;
};

export default function ProfessionalNextSessionCard({ sessions, userId, canViewHistory, canSchedule, openAgreements, onPrepare, onOpenNote, onSchedule }: Props) {
  const now = useMinuteClock();
  const [usageEvents, setUsageEvents] = useState<UsageEventRecord[]>([]);
  // Misma fuente que la pestaña Evolución: useEvolutionSummary + buildEvolutionCopy.
  const evolution = useEvolutionSummary(userId, 8, canViewHistory);
  const { stepsDirection, moodDirection } = useMemo(() => buildEvolutionCopy(evolution, 0), [evolution]);

  useEffect(() => {
    setUsageEvents([]);
    if (!canViewHistory) return undefined;
    let cancelled = false;
    fetchUsageEvents(userId, { limit: 80 }).then(rows => { if (!cancelled) setUsageEvents(rows); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [canViewHistory, userId]);

  const model = buildNextSessionModel({ sessions, now, canViewHistory, canSchedule, usageEvents, openAgreements, stepsDirection, moodDirection });
  const run = (action: SessionAction) => {
    if (action.kind === 'schedule') onSchedule();
    else if (action.kind === 'prepare' && action.session) onPrepare(action.session);
    else if (action.session) onOpenNote(action.session);
  };

  return <section aria-label="Tu próxima sesión" className="relative rounded-[24px] border-[1.5px] border-[#DACBF0] bg-white p-[18px] shadow-[0_12px_32px_rgba(111,76,166,.09),0_2px_6px_rgba(43,33,69,.05)]">
    <div className="flex items-center gap-3">
      <span aria-hidden className="inline-flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] bg-[#F1EAFB] text-[#553588]"><Calendar size={22} strokeWidth={2} /></span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-extrabold uppercase tracking-[.1em] text-[#6F4CA6]">Tu próxima sesión</p>
        <p className="mt-[3px] text-[16px] font-extrabold text-[#2B2145]">{model.title}</p>
      </div>
    </div>
    {model.chips.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">
      {model.chips.map(chip => {
        const Icon = chip.icon ? CHIP_ICONS[chip.icon] : undefined;
        return <Chip key={chip.id} tone={chip.tone}>{Icon && <Icon size={14} strokeWidth={2.4} aria-hidden />}{chip.text}</Chip>;
      })}
    </div>}
    {model.actions.length > 0 && <div className="mt-3.5 flex flex-wrap gap-2">
      {model.actions.map(action => {
        const { label, icon: Icon, primary } = ACTIONS[action.kind];
        return <HomeButton key={action.kind} primary={primary} onClick={() => run(action)} className={cn(primary ? 'text-[13.5px]' : 'border-[1.5px] border-[#DACBF0] bg-white')}><Icon size={17} strokeWidth={2.4} aria-hidden />{label}</HomeButton>;
      })}
    </div>}
  </section>;
}
