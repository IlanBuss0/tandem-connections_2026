import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Heart, MessageCircle, Sparkles, Sun, X } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';

type Props = {
  activeTab: string;
  onNavigate: (tab: string) => void;
  onOpenCantSpeak: () => void;
  centerContent?: (open: boolean) => ReactNode;
  compactProgress?: number;
  onOpenChange?: (open: boolean) => void;
};

const actions = [
  { id: 'routines', label: 'Mi día', icon: Sun, color: 'text-amber-600' },
  { id: 'emotions', label: 'Emociones', icon: Heart, color: 'text-rose-500' },
  { id: 'explainThis', label: 'Ayudame a entender', icon: Sparkles, color: 'text-violet-600' },
  { id: 'communicate', label: 'Comunicarme', icon: MessageCircle, color: 'text-sky-600' },
] as const;

export default function BelongingQuickActionsMenu({ activeTab, onNavigate, onOpenCantSpeak, centerContent, compactProgress = 0, onOpenChange }: Props) {
  const [open, setOpen] = useState(false);
  const [communicateOpen, setCommunicateOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => { onOpenChange?.(open); }, [onOpenChange, open]);

  const close = (restoreFocus = false) => {
    setOpen(false);
    setCommunicateOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => { close(); }, [activeTab]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(true);
      if (event.key === 'Tab' && menuRef.current) {
        const focusable = Array.from(menuRef.current.querySelectorAll<HTMLElement>('button:not([disabled])'));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    requestAnimationFrame(() => menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus());
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const navigate = (tab: string) => { close(); onNavigate(tab); };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 bg-white/10 backdrop-blur-[1px] lg:hidden"
            aria-hidden
            onClick={() => close(true)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            role="dialog"
            aria-label="Accesos rápidos"
            className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-0 right-0 z-[55] mx-auto grid w-[min(calc(100vw-3.5rem),22rem)] grid-cols-2 gap-2 lg:hidden"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: reduceMotion ? 0.1 : 0.2, ease: 'easeOut' }}
          >
            {actions.map((action) => (
              <div key={action.id} className="relative min-w-0">
                <button
                  type="button"
                  onClick={() => action.id === 'communicate' ? setCommunicateOpen(value => !value) : navigate(action.id)}
                  aria-label={action.label}
                  aria-expanded={action.id === 'communicate' ? communicateOpen : undefined}
                  className="group flex min-h-[58px] w-full items-center gap-2 rounded-[22px] border border-white/95 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(235,225,249,0.88))] px-2.5 text-left text-xs font-bold text-[#342641] shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_1px_0_0_rgba(255,255,255,0.82),0_4px_12px_rgba(70,45,96,0.11)] backdrop-blur-xl backdrop-saturate-125 transition hover:bg-white active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2"
                >
                  <action.icon size={20} className={`shrink-0 ${action.color}`} aria-hidden />
                  <span className="leading-tight">{action.label}</span>
                </button>
                <AnimatePresence>
                  {action.id === 'communicate' && communicateOpen && (
                    <motion.div
                      className="absolute bottom-[calc(100%+0.5rem)] right-0 z-10 w-[min(13rem,calc(100vw-1rem))] space-y-1 rounded-2xl border border-white/75 bg-white/70 p-1.5 shadow-lg backdrop-blur-2xl"
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                    >
                      <button type="button" onClick={() => navigate('communicator')} className="min-h-11 w-full rounded-xl px-3 text-left text-sm font-semibold text-[#49385c] hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]">Armar una frase</button>
                      <button type="button" onClick={() => { close(); onOpenCantSpeak(); }} className="min-h-11 w-full rounded-xl px-3 text-left text-sm font-semibold text-[#49385c] hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]">No puedo hablar</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => open ? close(true) : setOpen(true)}
        aria-label={open ? 'Cerrar accesos rápidos' : 'Abrir accesos rápidos'}
        aria-expanded={open}
        className="relative z-[60] inline-flex items-center justify-center rounded-full border-4 border-white bg-[#7447ac] text-white shadow-[0_7px_18px_rgba(92,52,139,0.35)] transition-colors hover:bg-[#633795] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2"
        style={{
          width: 60 - compactProgress * 12,
          height: 60 - compactProgress * 12,
          transform: `translateY(${-8 + compactProgress * 4}px)`,
        }}
      >
        <span style={{ transform: `scale(${1 - compactProgress * 0.14})` }}>
          {centerContent ? centerContent(open) : open ? <X size={26} aria-hidden /> : <span className="text-3xl font-light leading-none" aria-hidden>+</span>}
        </span>
      </button>
    </>
  );
}
