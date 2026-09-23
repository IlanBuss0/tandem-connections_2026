import { ChevronLeft } from 'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import type { EmotionalRecord } from '@/data/api';
import type { EvolutionWeek } from '@/data/usageApi';
import { activityIsDone } from './evolutionHelpers';
import AutonomyDetailContent from './detail/AutonomyDetailContent';
import MoodDetailContent from './detail/MoodDetailContent';
import ListDetailContent from './detail/ListDetailContent';

export type DetailKind = 'autonomy' | 'mood' | 'activities' | 'sessions' | 'objectives';

export interface EvolutionDetailSheetProps {
  open: DetailKind | null;
  onClose: () => void;
  userId: string;
  autonomyLabel: string;
  weeks: EvolutionWeek[];
  stepsDirection: 1 | 0 | -1 | null; moodDirection: 1 | 0 | -1 | null;
  autonomyAfter: string; participationAfter: string;
  earlierMood: number | null; recentMood: number | null;
  emotions: EmotionalRecord[];
  activities: { id: string; title: string; status: string; completed?: boolean; completedAt?: string | null }[];
  sessions: { id: number; titulo: string; estado: string; fecha_sesion: string }[];
  historyObjectives: { id: number; titulo: string; fecha_actualizacion: string }[];
  canViewHistory: boolean;
}

const dateLabel = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
};

export default function EvolutionDetailSheet(props: EvolutionDetailSheetProps) {
  const { open, onClose, userId, autonomyLabel, weeks, stepsDirection, moodDirection, autonomyAfter, participationAfter, earlierMood, recentMood, emotions, activities, sessions, historyObjectives, canViewHistory } = props;
  const isMobile = useIsMobile();

  if (open === 'autonomy' && !canViewHistory) return null;

  const titles: Record<DetailKind, string> = {
    autonomy: autonomyLabel,
    mood: 'Estado de ánimo',
    activities: 'Actividades completadas',
    sessions: 'Sesiones con profesionales',
    objectives: 'Objetivos cumplidos',
  };
  const descriptions: Record<DetailKind, string> = {
    autonomy: 'Detalle de pasos de rutina completados.',
    mood: 'Detalle de registros emocionales.',
    activities: 'Detalle de actividades completadas.',
    sessions: 'Detalle de sesiones realizadas con profesionales.',
    objectives: 'Detalle de objetivos cumplidos.',
  };

  return (
    <Sheet open={open !== null} onOpenChange={value => { if (!value) onClose(); }}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={`evolution-scope [&>button]:hidden ${isMobile ? 'h-[100dvh] w-full overflow-y-auto rounded-none' : 'w-full overflow-y-auto sm:max-w-[480px]'}`}
      >
        {open && (
          <>
            <div className="mb-4 flex items-center gap-2">
              <SheetClose className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--evo-border-1)] text-[var(--evo-text)] hover:bg-[var(--evo-soft)]">
                <ChevronLeft size={20} aria-hidden />
                <span className="sr-only">Volver</span>
              </SheetClose>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[var(--evo-primary-text)]">Detalle</p>
                <SheetTitle className="font-heading text-lg font-bold text-[var(--evo-text)]">{titles[open]}</SheetTitle>
              </div>
            </div>
            <SheetDescription className="sr-only">{descriptions[open]}</SheetDescription>

            {open === 'autonomy' && <AutonomyDetailContent userId={userId} weeks={weeks} direction={stepsDirection} afterText={autonomyAfter} />}
            {open === 'mood' && <MoodDetailContent emotions={emotions} weeks={weeks} direction={moodDirection} afterText={participationAfter} beforePercent={earlierMood !== null ? earlierMood * 100 : null} afterPercent={recentMood !== null ? recentMood * 100 : null} />}
            {open === 'activities' && <ListDetailContent emptyText="Todavía no hay actividades completadas." items={activities.filter(activityIsDone).map(item => ({ id: item.id, title: item.title, date: dateLabel(item.completedAt) }))} />}
            {open === 'sessions' && <ListDetailContent emptyText="Todavía no hay sesiones completadas." items={sessions.filter(session => session.estado === 'completada').map(session => ({ id: session.id, title: session.titulo, date: dateLabel(session.fecha_sesion) }))} />}
            {open === 'objectives' && <ListDetailContent emptyText="Todavía no hay objetivos cumplidos." items={historyObjectives.map(objective => ({ id: objective.id, title: objective.titulo, date: dateLabel(objective.fecha_actualizacion) }))} />}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
