import type { AcompanamientoData, PersonalNote, User } from '@/data/api';
import { Chip, ChevronLink, HomeButton, HomeCard, PatientAvatar, Pressable } from './HomeUi';
import { Divider, RowTitle } from './homeTokens';
import { attentionItems } from './homeData';
import { cn } from '@/lib/utils';

type Props = {
  patients: User[];
  now: Date;
  notesByUser: Record<string, PersonalNote[]>;
  agreements: Record<string, AcompanamientoData>;
  unscheduledUserIds: string[];
  onOpenPatient: (userId: string) => void;
  onSchedule: (userId: string) => void;
};

export default function HomeAttention(props: Props) {
  const items = attentionItems(props);
  if (!items.length) return null;
  return <HomeCard className="px-[18px] py-1.5">
    {items.map(({ patient, chips, unscheduled }, index) => <div key={patient.id} className={cn('flex min-h-[44px] items-center gap-3 py-3', index > 0 && Divider)}>
      <Pressable onClick={() => props.onOpenPatient(patient.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <PatientAvatar patient={patient} size={42} />
        <span className="min-w-0 flex-1"><span className={cn(RowTitle, 'block')}>{patient.name.split(' ')[0]}</span><span className="mt-[5px] flex flex-wrap gap-1.5">{chips.map(chip => <Chip key={chip.text} tone={chip.tone}>{chip.text}</Chip>)}</span></span>
        {!unscheduled && <ChevronLink />}
      </Pressable>
      {unscheduled && <HomeButton onClick={() => props.onSchedule(patient.id)}>Agendar</HomeButton>}
    </div>)}
  </HomeCard>;
}
