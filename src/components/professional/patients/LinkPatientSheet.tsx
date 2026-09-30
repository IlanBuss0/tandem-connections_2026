import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Calendar, Link as LinkIcon, Loader2, Network, X } from 'lucide-react';
import { HomeCard, Pressable, SectionTitle } from '@/components/professional/home/HomeUi';
import { EASE, useHomeReducedMotion } from '@/components/professional/home/homeTokens';
import { formatInviteCode } from '@/lib/professionalPatientsModel';
import { cn } from '@/lib/utils';

const CODE_LENGTH = 9;
const INVALID_CODE = 'El código no es válido o venció.';

const BENEFITS: { icon: typeof Calendar; tint: string; text: string }[] = [
  { icon: Calendar, tint: 'bg-[#F1EAFB] text-[#553588]', text: 'Ver y agendar sesiones' },
  { icon: Activity, tint: 'bg-[#DDF0FA] text-[#14587A]', text: 'Ver su evolución, si la familia lo habilita' },
  { icon: Network, tint: 'bg-[#DCF5EA] text-[#0B6B4A]', text: 'Coordinar en Colaboración' },
];

function CodeBoxes({ code, focused }: { code: string; focused: boolean }) {
  const chars = code.replace('-', '').split('');
  const active = Math.min(chars.length, 7);
  const box = (index: number): ReactNode => <span key={index} aria-hidden className={cn('inline-flex h-[52px] w-[38px] items-center justify-center rounded-[12px] border-[1.5px] bg-white font-heading text-[22px] font-extrabold text-[#2B2145] transition-colors duration-200', focused && index === active ? 'border-[#6F4CA6]' : 'border-[#DACBF0]')}>{chars[index] ?? ''}</span>;
  return <span className="flex items-center justify-center gap-1.5">
    {[0, 1, 2, 3].map(box)}
    <span aria-hidden className="text-[22px] font-extrabold text-[#675E78]">–</span>
    {[4, 5, 6, 7].map(box)}
  </span>;
}

type BodyProps = { onClose: () => void; onSubmit: (code: string) => Promise<void> };

function SheetBody({ onClose, onSubmit }: BodyProps) {
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) inputRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (code.length < CODE_LENGTH || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(code);
      onClose();
    } catch {
      setError(INVALID_CODE);
      setSubmitting(false);
    }
  };

  return <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
    <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[18px] pt-1">
      <label className="block">
        <span className="mb-2.5 block text-[13px] font-extrabold">Código de vínculo</span>
        <span className="relative block">
          <CodeBoxes code={code} focused={focused} />
          <input ref={inputRef} value={code} onChange={event => { setCode(formatInviteCode(event.target.value)); setError(null); }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} autoComplete="one-time-code" autoCapitalize="characters" autoCorrect="off" spellCheck={false} maxLength={CODE_LENGTH} enterKeyHint="go" aria-invalid={Boolean(error)} aria-describedby="link-code-help" className="absolute inset-0 h-full w-full cursor-text bg-transparent text-transparent caret-transparent opacity-0" />
        </span>
      </label>
      {error && <p role="alert" className="mt-3 text-center text-[13px] font-bold text-[#B3261E]">{error}</p>}
      <p id="link-code-help" className="mt-3 text-center text-[13px] leading-[1.5] text-[#675E78]">Te lo pasa la familia desde <b className="text-[#2B2145]">Personas vinculadas</b>. Vence a las 24 horas.</p>
      <SectionTitle>Cuando se vincule vas a poder</SectionTitle>
      <HomeCard className="p-[14px]">
        {BENEFITS.map(({ icon: Icon, tint, text }, index) => <div key={text} className={cn('flex min-h-[44px] items-center gap-3 py-2', index > 0 && 'border-t border-[#EFE7F9]')}>
          <span aria-hidden className={cn('inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[14px]', tint)}><Icon size={18} strokeWidth={2} /></span>
          <span className="min-w-0 flex-1 text-[14px] font-bold leading-[1.35] text-[#2B2145]">{text}</span>
        </div>)}
      </HomeCard>
      <p className="mt-2.5 text-[12.5px] leading-[1.5] text-[#675E78]">La familia decide qué más compartir. Lo podés ver en el Centro de cada paciente.</p>
    </div>
    <div className="border-t border-[#EFE7F9] bg-white px-[18px] pb-[max(24px,env(safe-area-inset-bottom))] pt-3">
      <button type="submit" disabled={code.length < CODE_LENGTH || submitting} className="inline-flex min-h-[50px] w-full items-center justify-center gap-[7px] rounded-[16px] bg-[#6F4CA6] px-4 text-[14.5px] font-extrabold text-white shadow-[0_6px_16px_rgba(111,76,166,.25)] transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6F4CA6] focus-visible:ring-offset-2 disabled:opacity-50">
        {submitting ? <Loader2 size={17} className="animate-spin" aria-hidden /> : <LinkIcon size={17} strokeWidth={2.4} aria-hidden />}Vincular
      </button>
    </div>
  </form>;
}

type Props = BodyProps & { open: boolean };

/** Hoja inferior: entra 360 ms, sale 260 ms; el fondo aparece en 220 ms. */
export default function LinkPatientSheet({ open, onClose, onSubmit }: Props) {
  const reduce = useHomeReducedMotion();
  const panelMotion = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.1 } }, exit: { opacity: 0, transition: { duration: 0.1 } } }
    : { initial: { y: '100%' }, animate: { y: 0, transition: { duration: 0.36, ease: EASE } }, exit: { y: '100%', transition: { duration: 0.26, ease: EASE } } };
  return <AnimatePresence>{open && <div className="fixed inset-0 z-[80]">
    <motion.div aria-hidden onClick={onClose} className="absolute inset-0 bg-[rgba(43,33,69,.45)]" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.22 } }} exit={{ opacity: 0, transition: { duration: 0.22 } }} />
    <motion.div role="dialog" aria-modal="true" aria-labelledby="link-patient-title" {...panelMotion} className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[calc(100dvh-60px)] w-full max-w-[520px] flex-col rounded-t-[28px] bg-white font-sans text-[#2B2145] shadow-[0_-10px_30px_rgba(43,33,69,.25)]">
      <div className="flex-none">
        <div className="flex justify-center pt-2.5"><span aria-hidden className="h-[5px] w-11 rounded-[3px] bg-[#DACBF0]" /></div>
        <div className="flex items-start gap-3 px-[18px] pb-2 pt-3">
          <h2 id="link-patient-title" className="flex-1 font-heading text-[22px] font-extrabold leading-[1.15]">Vincular un paciente</h2>
          <Pressable onClick={onClose} aria-label="Cerrar" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F5F0FC] text-[#553588]"><X size={20} strokeWidth={2.2} aria-hidden /></Pressable>
        </div>
      </div>
      <SheetBody onClose={onClose} onSubmit={onSubmit} />
    </motion.div>
  </div>}</AnimatePresence>;
}
