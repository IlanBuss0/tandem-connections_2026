import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { EASE, initials, useHomeReducedMotion } from './homeTokens';
import { cn } from '@/lib/utils';
import type { User } from '@/data/api';

type PressProps = { className?: string; onClick?: () => void; children: ReactNode; 'aria-label'?: string };

/** Botón con press de escala 0.97 en 100 ms. */
export function Pressable({ className, children, ...rest }: PressProps) {
  const reduce = useHomeReducedMotion();
  return <motion.button type="button" whileTap={reduce ? undefined : { scale: 0.97 }} transition={{ duration: 0.1, ease: EASE }} className={cn('focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6F4CA6] focus-visible:ring-offset-2', className)} {...rest}>{children}</motion.button>;
}

const BUTTON = 'inline-flex min-h-[44px] items-center justify-center gap-[7px] whitespace-nowrap rounded-[16px] px-4 text-[13px] font-extrabold';
export function HomeButton({ primary, className, ...props }: PressProps & { primary?: boolean }) {
  return <Pressable className={cn(BUTTON, primary ? 'bg-[#6F4CA6] text-white shadow-[0_6px_16px_rgba(111,76,166,.25)]' : 'bg-[#F1EAFB] text-[#553588]', className)} {...props} />;
}

const CHIP_TONES = {
  purple: 'bg-[#F1EAFB] text-[#553588]',
  amber: 'bg-[#FFEFCF] text-[#7A4300]',
  green: 'bg-[#DCF5EA] text-[#0B6B4A]',
  gray: 'bg-[#EDEAF3] text-[#4A4360]',
} as const;
export type ChipTone = keyof typeof CHIP_TONES;
export function Chip({ tone, children }: { tone: ChipTone; children: ReactNode }) {
  return <span className={cn('inline-flex items-center gap-[5px] rounded-full px-2.5 py-1 text-[12px] font-bold leading-[1.25] [&_svg]:shrink-0', CHIP_TONES[tone])}>{children}</span>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return <div className="mx-[2px] mb-2.5 mt-6 flex items-center justify-between gap-3"><h2 className="font-sans text-[12px] font-extrabold uppercase tracking-[.14em] text-[#584E6E]">{children}</h2>{action}</div>;
}

export function HomeCard({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('relative rounded-[24px] border border-[rgba(217,213,247,.7)] bg-white shadow-[0_12px_32px_rgba(111,76,166,.09),0_2px_6px_rgba(43,33,69,.05)]', className)}>{children}</section>;
}

const TINTS = [
  'bg-[#F1EAFB] text-[#553588]', 'bg-[#DCF5EA] text-[#0B6B4A]', 'bg-[#DDF0FA] text-[#14587A]', 'bg-[#FFEFCF] text-[#7A4300]',
];
export function PatientAvatar({ patient, size }: { patient: User; size: 40 | 42 }) {
  const tint = TINTS[Number(String(patient.id).replace(/\D/g, '') || 0) % TINTS.length];
  return <span aria-hidden className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-extrabold', tint, size === 40 ? 'h-10 w-10 text-[14px]' : 'h-[42px] w-[42px] text-[15px]')}>{initials(patient.name)}</span>;
}

export function ChevronLink({ size = 20 }: { size?: number }) {
  return <ChevronRight width={size} height={size} strokeWidth={2.4} color="#553588" className="shrink-0" aria-hidden />;
}
