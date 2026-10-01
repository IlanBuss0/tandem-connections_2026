import { motion } from 'framer-motion';
import { Calendar, Check, Lock } from 'lucide-react';
import { Chip, ChevronLink, HomeButton, Pressable } from '@/components/professional/home/HomeUi';
import { Divider, EASE, RowTitle, initials, useHomeReducedMotion } from '@/components/professional/home/homeTokens';
import { formatNextSession, type PatientListItem } from '@/lib/professionalPatientsModel';
import { cn } from '@/lib/utils';

const TINTS = [
  'bg-[#F1EAFB] text-[#553588]', 'bg-[#DCF5EA] text-[#0B6B4A]', 'bg-[#FFEFCF] text-[#7A4300]', 'bg-[#DDF0FA] text-[#14587A]', 'bg-[#EDEAF3] text-[#4A4360]',
];
const IMAGE_AVATAR = /^(https?:|data:image\/|\/|\.\/|\.\.\/)/;

function Avatar({ item }: { item: PatientListItem }) {
  const { patient } = item;
  const tint = TINTS[Number(String(patient.id).replace(/\D/g, '') || 0) % TINTS.length];
  const image = patient.avatar && IMAGE_AVATAR.test(patient.avatar) ? patient.avatar : undefined;
  return <span aria-hidden className={cn('inline-flex h-[46px] w-[46px] shrink-0 items-center justify-center overflow-hidden rounded-full text-[17px] font-extrabold', tint)}>
    {image ? <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" /> : initials(patient.name)}
  </span>;
}

function StatusChip({ item }: { item: PatientListItem }) {
  const { chip } = item;
  // Reserva la altura del chip mientras el dato llega, para que la fila no salte.
  if (!chip) return <div aria-hidden className="mt-1.5 h-[23px]" />;
  return <div className="mt-1.5"><Chip tone={chip.tone}>
    {chip.kind === 'private' && <Lock size={14} strokeWidth={2.4} aria-hidden />}
    {chip.kind === 'upToDate' && <Check size={14} strokeWidth={2.4} aria-hidden />}
    {chip.text}
  </Chip></div>;
}

type Props = { item: PatientListItem; now: Date; first: boolean; onOpen: (userId: string) => void; onSchedule: (userId: string) => void };

export default function PatientRow({ item, now, first, onOpen, onSchedule }: Props) {
  const reduce = useHomeReducedMotion();
  const { patient, nextSessionAt, canSchedule } = item;
  const offerSchedule = !nextSessionAt && canSchedule;
  return <motion.li layout={reduce ? false : 'position'} transition={{ duration: 0.24, ease: EASE }} className={cn('flex min-h-[44px] items-center gap-3 py-3 md:rounded-[24px] md:border md:border-[rgba(217,213,247,.7)] md:bg-white md:p-4 md:shadow-[0_12px_32px_rgba(111,76,166,.09),0_2px_6px_rgba(43,33,69,.05)]', !first && Divider)}>
    <Pressable onClick={() => onOpen(patient.id)} className="flex min-w-0 flex-1 items-center gap-3 rounded-[12px] text-left">
      <Avatar item={item} />
      <span className="min-w-0 flex-1">
        <span className={cn(RowTitle, 'block break-words')}>{patient.name}{patient.age ? <span className="text-[12.5px] font-semibold text-[#675E78]"> · {patient.age} años</span> : null}</span>
        <span className="mt-[3px] flex items-center gap-[5px] text-[12.5px] leading-[1.45] text-[#675E78]"><Calendar size={14} strokeWidth={2.2} aria-hidden />{nextSessionAt ? formatNextSession(nextSessionAt, now) : 'Sin próxima sesión'}</span>
        <StatusChip item={item} />
      </span>
      {!offerSchedule && <ChevronLink />}
    </Pressable>
    {offerSchedule && <HomeButton onClick={() => onSchedule(patient.id)}>Agendar</HomeButton>}
  </motion.li>;
}
